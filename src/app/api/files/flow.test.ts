/**
 * @jest-environment node
 */
import { POST as UploadPOST } from '@/app/api/files/route';
import { POST as ConfirmPOST } from '@/app/api/files/confirm/route';
import { GET as RedirectGET } from '@/app/api/files/[id]/route';
import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { s3Storage } from '@/lib/storage/s3-storage';

// Mocks
jest.mock('@/lib/aws-s3', () => ({
  BUCKET_NAME: 'test-bucket',
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  supabaseAdmin: {
    rpc: jest.fn(),
  }
}));

jest.mock('@/lib/storage/s3-storage', () => ({
  s3Storage: {
    getUploadUrl: jest.fn(),
    deleteFile: jest.fn(),
    getFileMetadata: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
  },
}));

jest.mock('@/lib/cdn-signer', () => ({
  cdnSigner: {
    generateSignedUrl: jest.fn().mockReturnValue('https://cdn.example.com/file?token=123'),
  },
}));

describe('Complete File Upload Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Get Upload URL', () => {
    it('should generate path with date and uuid', async () => {
      (s3Storage.getUploadUrl as jest.Mock).mockResolvedValue({
        uploadUrl: 'https://s3-upload',
        publicUrl: 'https://s3-public/key'
      });

      const req = new NextRequest('http://localhost/api/files', {
        method: 'POST',
        body: JSON.stringify({ filename: 'test.png', contentType: 'image/png', ttl: 1440 }),
      });

      const res = await UploadPOST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.key).toMatch(/^\d{4}-\d{2}-\d{2}\/.+-.+$/); // YYYY-MM-DD/UUID-filename
      expect(json.data.uploadUrl).toBeDefined();
    });
  });

  describe('Step 2: Confirm Upload', () => {
    it('should record file in DB and schedule deletion', async () => {
      // Mock S3 Metadata
      (s3Storage.getFileMetadata as jest.Mock).mockResolvedValue({
        size: 1024,
        contentType: 'image/png'
      });

      // Mock DB Insert
      const mockFileId = '123-uuid';
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: mockFileId }, error: null })
          })
        })
      });

      const req = new NextRequest('http://localhost/api/files/confirm', {
        method: 'POST',
        body: JSON.stringify({
          key: '2024-01-01/uuid-test.png',
          filename: 'test.png',
          contentType: 'image/png',
          ttl: 1440
        }),
      });

      const res = await ConfirmPOST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.fileId).toBe(mockFileId);
      expect(json.data.accessUrl).toContain(`/files/${mockFileId}`);

      // Check RPC call for scheduling
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('schedule_one_time_deletion', expect.anything());
    });
  });

  describe('Step 3: Access File', () => {
    it('should redirect to CDN if valid', async () => {
      process.env.CDN_DOMAIN = 'cdn.example.com';
      process.env.TYPEA_SIGN_TOKEN = 'secret';

      // Mock DB Select
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'key',
                status: 'uploaded',
                expires_at: new Date(Date.now() + 10000).toISOString()
              },
              error: null
            })
          })
        })
      });

      const params = { id: '123' };
      const req = new NextRequest('http://localhost/api/files/123');
      const res = await RedirectGET(req, { params });

      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('https://cdn.example.com');
    });

    it('should return 410 if expired', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                key: 'key',
                status: 'uploaded',
                expires_at: new Date(Date.now() - 10000).toISOString() // Expired
              },
              error: null
            })
          })
        })
      });

      const params = { id: '123' };
      const req = new NextRequest('http://localhost/api/files/123');
      const res = await RedirectGET(req, { params });

      expect(res.status).toBe(410);
    });
  });
});
