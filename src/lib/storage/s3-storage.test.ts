import { S3StorageService } from './s3-storage';
import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3StorageService', () => {
  let service: S3StorageService;
  const mockS3Client = new S3Client({});
  const bucket = 'test-bucket';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new S3StorageService('us-east-1', 'key', 'secret', bucket);
    // @ts-ignore
    service.client = mockS3Client;
  });

  it('should generate upload URL', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url');

    const result = await service.getUploadUrl('test.txt', 'text/plain');

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: 'test.txt',
      ContentType: 'text/plain',
    });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(result.uploadUrl).toBe('https://signed-url');
    expect(result.publicUrl).toContain('test.txt');
  });

  it('should delete a file', async () => {
    (mockS3Client.send as jest.Mock).mockResolvedValue({});

    await service.deleteFile('test.txt');

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: 'test.txt',
    });
    expect(mockS3Client.send).toHaveBeenCalled();
  });

  it('should batch delete files', async () => {
    (mockS3Client.send as jest.Mock).mockResolvedValue({});

    await service.deleteFiles(['file1.txt', 'file2.txt']);

    expect(DeleteObjectsCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Delete: {
        Objects: [{ Key: 'file1.txt' }, { Key: 'file2.txt' }],
        Quiet: true,
      },
    });
    expect(mockS3Client.send).toHaveBeenCalled();
  });
});
