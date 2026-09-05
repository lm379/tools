import { NextRequest } from 'next/server';
import { s3Storage } from '@/lib/storage/s3-storage';
import { BUCKET_NAME } from '@/lib/aws-s3';
import { supabase, supabaseAdmin } from '@/lib/cloudbase';
import { successResponse, handleApiError, ApiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
// import { cdnSigner } from '@/lib/cdn-signer';

export async function POST(request: NextRequest) {
  try {
    const { key, filename, contentType, ttl } = await request.json();

    if (!key || !filename || !contentType) {
      throw new ApiError('Key, Filename and Content-Type are required', 400);
    }

    // TTL Validation
    let ttlMinutes = (ttl !== undefined && ttl !== null && ttl !== '') ? parseInt(ttl as string) : 10080;
    if (isNaN(ttlMinutes) || ttlMinutes < 1 || ttlMinutes > 10080) {
      throw new ApiError('TTL must be between 1 minute and 7 days', 400);
    }

    // Verify file exists in S3 and get size
    const s3Metadata = await s3Storage.getFileMetadata(key);
    if (!s3Metadata) {
       throw new ApiError('File not found in storage', 400); 
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    // Transactional DB Insert.
    // CloudBase PG exposes a postgREST client (app.rdb()) so the insert chain
    // is identical to the original Supabase code. A single insert is atomic.
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        key: key,
        bucket: BUCKET_NAME,
        expires_at: expiresAt.toISOString(),
        metadata: { originalName: filename, contentType, size: s3Metadata.size },
        status: 'uploaded' // Mark as uploaded immediately as per requirement
      })
      .select('id')
      .single();

    if (dbError || !fileRecord) {
      console.error('CloudBase PG Error:', dbError);
      // Rollback: Delete file from S3 if DB insert fails
      await s3Storage.deleteFile(key);
      throw new ApiError('Failed to save file record, rolled back upload', 500);
    }

    // Schedule Deletion Task
    // The original implementation called a Supabase pg_cron RPC
    // (schedule_one_time_deletion) to schedule a one-shot HTTP deletion exactly
    // at expires_at. CloudBase PG is managed PostgreSQL and pg_cron + pg_net
    // extensions are not guaranteed to be available there. Instead, we rely on
    // the high-frequency cleanup cloud function (cloudfunctions/cleanupExpiredFiles,
    // runs every 10 minutes via a timer trigger) to delete expired files.
    // The original Next.js code already notes: "Non-fatal, daily cleanup will
    // catch it", so omitting per-file one-shot scheduling keeps the same fallback
    // guarantee while simplifying the architecture.
    void supabaseAdmin; // kept for parity with the original export surface

    // Generate Access URL
    // Format: ${base_url}/files/${file_id}
    // We need the ID from the inserted record.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    // Remove /api suffix if present to get clean base url if needed, 
    // but usually origin is just host.
    // However, if appUrl comes from env, it might have path.
    // Let's rely on relative path for frontend or absolute if needed.
    const accessUrl = `${appUrl}/files/${fileRecord.id}`;

    // Async Logging
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    
    (async () => {
      try {
        await logger.log({
          type: 'upload',
          file_id: fileRecord.id,
          file_key: key,
          file_name: filename,
          file_size: s3Metadata.size,
          mime_type: contentType,
          status: 'success',
          ip: ip,
          user_agent: userAgent,
        });
      } catch (e) {
        console.error('Async logging error:', e);
      }
    })();

    return successResponse({
      fileId: fileRecord.id,
      accessUrl: accessUrl,
      expiresAt: expiresAt.toISOString(),
      ttlMinutes
    }, 'File confirmed and recorded successfully', 201);

  } catch (error) {
    return handleApiError(error);
  }
}
