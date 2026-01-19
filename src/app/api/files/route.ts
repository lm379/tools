import { NextRequest } from 'next/server';
import { s3Storage } from '@/lib/storage/s3-storage';
import { BUCKET_NAME } from '@/lib/aws-s3';
// import { supabase, supabaseAdmin } from '@/lib/supabase';
import { successResponse, handleApiError, ApiError } from '@/lib/api-response';
// import { cdnSigner } from '@/lib/cdn-signer';

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, ttl } = await request.json();

    if (!filename || !contentType) {
      throw new ApiError('Filename and Content-Type are required', 400);
    }

    // TTL Validation
    // Default 168 hours (7 days)
    let ttlHours = (ttl !== undefined && ttl !== null && ttl !== '') ? parseInt(ttl as string) : 168;

    if (isNaN(ttlHours) || ttlHours < 1 || ttlHours > 168) {
      throw new ApiError('TTL must be between 1 and 168 hours', 400);
    }

    if (!BUCKET_NAME) {
      throw new ApiError('AWS Bucket Name is not configured', 500);
    }

    // 2. Upload path generation (Date/UUID-filename)
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = crypto.randomUUID();
    const uniqueFilename = `${date}/${uuid}-${filename}`;

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    // Get Signed URL for Upload (Direct to S3)
    const { uploadUrl, publicUrl: s3PublicUrl } = await s3Storage.getUploadUrl(uniqueFilename, contentType);

    // 3. Return upload config to frontend first
    // Frontend will upload to S3, then confirm to backend to create DB record
    return successResponse({
      uploadUrl,
      publicUrl: s3PublicUrl, // This will be final S3 path
      key: uniqueFilename,
      expiresAt: expiresAt.toISOString(),
    }, 'Upload URL generated successfully', 201);


  } catch (error) {
    return handleApiError(error);
  }
}
