import { S3StorageService } from './s3-storage';
import { S3Client } from '@aws-sdk/client-s3';

// Mock S3Client
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    DeleteObjectsCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url'),
}));

describe('S3StorageService Endpoint Configuration', () => {
  const region = 'us-east-1';
  const accessKey = 'key';
  const secretKey = 'secret';
  const bucket = 'test-bucket';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with custom endpoint', () => {
    const endpoint = 'https://custom.s3.com';
    new S3StorageService(region, accessKey, secretKey, bucket, endpoint);

    expect(S3Client).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: endpoint,
      forcePathStyle: false,
    }));
  });

  it('should initialize with forcePathStyle', () => {
    const endpoint = 'https://minio.local';
    new S3StorageService(region, accessKey, secretKey, bucket, endpoint, true);

    expect(S3Client).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: endpoint,
      forcePathStyle: true,
    }));
  });

  it('should validate endpoint protocol', () => {
    const invalidEndpoint = 'ftp://custom.s3.com';
    expect(() => {
      new S3StorageService(region, accessKey, secretKey, bucket, invalidEndpoint);
    }).toThrow('Endpoint must use http or https protocol');
  });

  it('should validate malformed url', () => {
    const invalidEndpoint = 'not-a-url';
    expect(() => {
      new S3StorageService(region, accessKey, secretKey, bucket, invalidEndpoint);
    }).toThrow('Invalid endpoint URL');
  });

  describe('Public URL Generation', () => {
    it('should generate standard AWS URL when no endpoint provided', async () => {
      const service = new S3StorageService(region, accessKey, secretKey, bucket);
      const { publicUrl } = await service.getUploadUrl('file.txt', 'text/plain');
      expect(publicUrl).toBe(`https://${bucket}.s3.amazonaws.com/file.txt`);
    });

    it('should generate path-style URL when forcePathStyle is true', async () => {
      const endpoint = 'https://minio.local';
      const service = new S3StorageService(region, accessKey, secretKey, bucket, endpoint, true);
      const { publicUrl } = await service.getUploadUrl('file.txt', 'text/plain');
      expect(publicUrl).toBe(`${endpoint}/${bucket}/file.txt`);
    });

    it('should generate virtual-host-style URL when forcePathStyle is false', async () => {
      const endpoint = 'https://custom.s3.com';
      const service = new S3StorageService(region, accessKey, secretKey, bucket, endpoint, false);
      const { publicUrl } = await service.getUploadUrl('file.txt', 'text/plain');
      expect(publicUrl).toBe(`https://${bucket}.custom.s3.com/file.txt`);
    });

    it('should handle endpoint trailing slash', async () => {
      const endpoint = 'https://minio.local/';
      const service = new S3StorageService(region, accessKey, secretKey, bucket, endpoint, true);
      const { publicUrl } = await service.getUploadUrl('file.txt', 'text/plain');
      expect(publicUrl).toBe(`https://minio.local/${bucket}/file.txt`);
    });
  });
});
