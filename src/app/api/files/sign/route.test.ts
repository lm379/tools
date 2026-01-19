/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cdnSigner } from '@/lib/cdn-signer';

// Mocks
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/cdn-signer', () => ({
  cdnSigner: {
    generateSignedUrl: jest.fn(),
  },
}));

describe('File Sign API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CDN_DOMAIN = 'cdn.example.com';
    process.env.TYPEA_SIGN_TOKEN = 'secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 400 if key is missing', async () => {
    const req = new NextRequest('http://localhost/api/files/sign', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 if file not found', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/files/sign', {
      method: 'POST',
      body: JSON.stringify({ key: 'missing.png' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should return 503 if CDN config missing', async () => {
    delete process.env.CDN_DOMAIN;

    const req = new NextRequest('http://localhost/api/files/sign', {
      method: 'POST',
      body: JSON.stringify({ key: 'test.png' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('should return signed URL if valid', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { key: 'test.png', status: 'pending' },
            error: null
          }),
        }),
      }),
    });

    (cdnSigner.generateSignedUrl as jest.Mock).mockReturnValue('https://cdn.example.com/test.png?token=123');

    const req = new NextRequest('http://localhost/api/files/sign', {
      method: 'POST',
      body: JSON.stringify({ key: 'test.png' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.url).toBe('https://cdn.example.com/test.png?token=123');
  });
});
