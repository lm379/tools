import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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

  /**
   * Builds the public (unsigned) URL for an object.
   *
   * Honors AWS_ENDPOINT for S3-compatible providers (e.g. Qiniu Kodo, MinIO):
   * with an endpoint set we must NOT fall back to the hardcoded
   * `<bucket>.s3.amazonaws.com` host, otherwise the URL points at AWS S3 and
   * 404s / resolves to someone else's bucket.
   */
  getPublicUrl(key: string): string {
    if (this.endpoint) {
      // Remove trailing slash
      const baseUrl = this.endpoint.replace(/\/$/, '');
      if (this.forcePathStyle) {
        return `${baseUrl}/${this.bucket}/${key}`;
      }
      // Attempt virtual-host style if hostname allows
      try {
        const urlObj = new URL(baseUrl);
        urlObj.hostname = `${this.bucket}.${urlObj.hostname}`;
        urlObj.pathname = `/${key}`;
        return urlObj.toString();
      } catch {
        // Fallback to path style if URL manipulation fails
        return `${baseUrl}/${this.bucket}/${key}`;
      }
    }
    // Standard AWS S3 URL
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async getUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const publicUrl = this.getPublicUrl(key);

    return { uploadUrl, publicUrl };
  }

  async getFileMetadata(key: string): Promise<{ size: number; contentType: string } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
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
