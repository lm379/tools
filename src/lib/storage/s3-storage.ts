import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from './types';

export class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;
  private endpoint?: string;
  private forcePathStyle: boolean;

  constructor(
    region: string, 
    accessKeyId: string, 
    secretAccessKey: string, 
    bucket: string,
    endpoint?: string,
    forcePathStyle: boolean = false
  ) {
    if (endpoint) {
        this.validateEndpoint(endpoint);
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle
    });
    this.bucket = bucket;
    this.endpoint = endpoint;
    this.forcePathStyle = forcePathStyle;
  }

  private validateEndpoint(url: string) {
      let parsed: URL;
      try {
          parsed = new URL(url);
      } catch (e) {
          throw new Error(`Invalid endpoint URL: ${url}`);
      }
      
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Endpoint must use http or https protocol');
      }
  }

  async getUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    
    let publicUrl = '';
    if (this.endpoint) {
        // Remove trailing slash
        const baseUrl = this.endpoint.replace(/\/$/, '');
        if (this.forcePathStyle) {
            publicUrl = `${baseUrl}/${this.bucket}/${key}`;
        } else {
            // Attempt virtual-host style if hostname allows
            try {
                const urlObj = new URL(baseUrl);
                urlObj.hostname = `${this.bucket}.${urlObj.hostname}`;
                urlObj.pathname = `/${key}`;
                publicUrl = urlObj.toString();
            } catch {
                // Fallback to path style if URL manipulation fails
                publicUrl = `${baseUrl}/${this.bucket}/${key}`;
            }
        }
    } else {
        // Standard AWS S3 URL
        publicUrl = `https://${this.bucket}.s3.amazonaws.com/${key}`; 
    }
    
    return { uploadUrl, publicUrl };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    
    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: true,
      },
    });
    await this.client.send(command);
  }
}

// Singleton instance
export const s3Storage = new S3StorageService(
  process.env.AWS_REGION || 'us-east-1',
  process.env.AWS_ACCESS_KEY_ID || '',
  process.env.AWS_SECRET_ACCESS_KEY || '',
  process.env.AWS_BUCKET_NAME || '',
  process.env.AWS_ENDPOINT,
  process.env.AWS_FORCE_PATH_STYLE === 'true'
);
