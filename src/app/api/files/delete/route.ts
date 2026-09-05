import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/cloudbase';
import { s3Storage } from '@/lib/storage/s3-storage';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    // 1. Security Check
    // Previously the route accepted SUPABASE_SERVICE_ROLE_KEY as a fallback for
    // CRON_SECRET. After migration, only CRON_SECRET is used — the CloudBase
    // server API Key never leaves the server and is not a valid cron token.
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const validToken = process.env.CRON_SECRET;

    if (!token || token !== validToken) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { key } = body;

    if (!key) {
      return errorResponse('File key is required', 400);
    }

    console.log(`[Auto-Delete] Processing deletion for key: ${key}`);

    // 2. Delete from S3
    try {
      await s3Storage.deleteFile(key);
    } catch (s3Error) {
      console.error(`[Auto-Delete] S3 Deletion failed for ${key}:`, s3Error);
      // The original one-shot cron schedule had no automatic retry either;
      // returning 500 keeps the same behavior. The high-frequency cleanup
      // cloud function (every 10 minutes) will retry deletion of any file
      // whose expires_at has passed.
      return errorResponse('S3 Deletion Failed', 500);
    }

    // 3. Update Database: soft-delete the record.
    // CloudBase PG postgREST chain identical to the original Supabase code.
    const { error: dbError } = await supabaseAdmin
      .from('files')
      .update({ status: 'deleted' })
      .eq('key', key);

    if (dbError) {
      console.error(`[Auto-Delete] DB Update failed for ${key}:`, dbError);
      return errorResponse('Database Update Failed', 500);
    }

    // 4. Unschedule Cron Job
    // The previous implementation called an unschedule_cron_job Supabase RPC
    // that removed the one-shot pg_cron task for this key. With CloudBase,
    // pg_cron + pg_net are not guaranteed on managed PG and we rely on the
    // high-frequency cleanup cloud function instead, so there is nothing to
    // unschedule here.

    return successResponse({ deleted: true, key }, 'File deleted and task cleaned up');

  } catch (error) {
    console.error('[Auto-Delete] Unexpected error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
