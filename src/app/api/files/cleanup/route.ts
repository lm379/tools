import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { s3Storage } from '@/lib/storage/s3-storage';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify Authorization header if needed
    // const authHeader = request.headers.get('Authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    // 1. Query expired files
    const now = new Date().toISOString();
    
    // Batch size of 100 to ensure reliability within timeout limits
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('files')
      .select('id, key')
      .lt('expires_at', now)
      .neq('status', 'deleted') // Don't try to delete already deleted ones if we soft-delete
      .limit(100);

    if (fetchError) {
      console.error('Error fetching expired files:', fetchError);
      return errorResponse('Database error', 500);
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      return successResponse({ count: 0 }, 'No expired files found');
    }

    const keysToDelete = expiredFiles.map(f => f.key);
    const idsToDelete = expiredFiles.map(f => f.id);

    console.log(`Found ${keysToDelete.length} expired files to delete.`);

    // 2. Delete from S3
    // S3 delete is idempotent, so it's safe to retry if it failed previously
    try {
        await s3Storage.deleteFiles(keysToDelete);
    } catch (s3Error) {
        console.error('S3 Delete Error:', s3Error);
        return errorResponse('Failed to delete files from storage', 500);
    }

    // 3. Delete from DB
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
        console.error('DB Delete Error:', deleteError);
        // Files are gone from S3 but record remains. 
        // Next run will try to delete from S3 (no-op) and then try DB delete again.
        return errorResponse('Failed to delete records from database', 500);
    }

    return successResponse({ count: idsToDelete.length, keys: keysToDelete }, 'Cleanup successful');

  } catch (error) {
    console.error('Cleanup Error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
