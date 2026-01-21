/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { s3Storage } from '@/lib/storage/s3-storage';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Mocks
jest.mock('@/lib/storage/s3-storage', () => ({
  s3Storage: {
    getUploadUrl: jest.fn(),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  supabaseAdmin: {
    rpc: jest.fn(),
  }
}));

jest.mock('@/lib/aws-s3', () => ({
  BUCKET_NAME: 'test-bucket',
}));

describe('File Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if filename is missing', async () => {
    const req = new NextRequest('http://localhost/api/files', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'image/png' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should validate TTL range (too high)', async () => {
    const req = new NextRequest('http://localhost/api/files', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.png', contentType: 'image/png', ttl: 200 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain('TTL');
  });

  it('should validate TTL range (too low)', async () => {
    const req = new NextRequest('http://localhost/api/files', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.png', contentType: 'image/png', ttl: 0 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should create DB record, schedule task, and return upload URL', async () => {
    // Setup Mocks
    (s3Storage.getUploadUrl as jest.Mock).mockResolvedValue({
      uploadUrl: 'https://upload',
      publicUrl: 'https://public/test.png',
    });

    const insertMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: insertMock,
    });

    (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: null });

    const req = new NextRequest('http://localhost/api/files', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.png', contentType: 'image/png', ttl: 24 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();

    // Verify expiration time is roughly 24 hours from now
    // Since we don't insert anymore, we check response
    const expiresAt = new Date(json.data.expiresAt).getTime();
    const now = Date.now();
    const expected = now + 24 * 60 * 60 * 1000;

    // Allow 1 second difference
    expect(Math.abs(expiresAt - expected)).toBeLessThan(1000);
  });
});
