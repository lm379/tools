/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { s3Storage } from '@/lib/storage/s3-storage';
import { supabase } from '@/lib/cloudbase';

// Mocks
jest.mock('@/lib/storage/s3-storage', () => ({
  s3Storage: {
    deleteFiles: jest.fn(),
  },
}));

// Mock CloudBase db (postgREST chain) — same shape as the original Supabase
// mock. The route calls supabase.from('files').select(...).lt(...).neq(...).limit()
// for the query, and supabase.from('files').delete().in(...) for the removal.
jest.mock('@/lib/cloudbase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Cleanup API', () => {
  const MOCK_SECRET = 'test-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = MOCK_SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('should return 200 if no expired files', async () => {
    // Mock postgREST select chain
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/files/cleanup', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOCK_SECRET}`
      }
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.count).toBe(0);
  });

  it('should delete expired files from S3 and DB', async () => {
    const mockFiles = [
      { id: '1', key: 'file1.txt' },
      { id: '2', key: 'file2.txt' },
    ];

    // The route hits supabase.from('files') twice:
    //   1) .select().lt().neq().limit()  -> query
    //   2) .delete().in()                -> batch delete
    // Use mockReturnValueOnce to feed different shapes per call.
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockFiles, error: null }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

    // Mock S3 delete
    (s3Storage.deleteFiles as jest.Mock).mockResolvedValue(undefined);

    const req = new NextRequest('http://localhost/api/files/cleanup', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOCK_SECRET}`
      }
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.count).toBe(2);
    expect(s3Storage.deleteFiles).toHaveBeenCalledWith(['file1.txt', 'file2.txt']);
  });

  it('should handle S3 error', async () => {
    const mockFiles = [{ id: '1', key: 'file1.txt' }];

    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          neq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockFiles, error: null }),
          }),
        }),
      }),
    });

    // Mock S3 error
    (s3Storage.deleteFiles as jest.Mock).mockRejectedValue(new Error('S3 Error'));

    const req = new NextRequest('http://localhost/api/files/cleanup', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOCK_SECRET}`
      }
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});
