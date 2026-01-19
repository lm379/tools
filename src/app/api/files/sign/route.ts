import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cdnSigner } from '@/lib/cdn-signer';
import { successResponse, handleApiError, ApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      throw new ApiError('Key is required', 400);
    }

    if (!process.env.CDN_DOMAIN || !process.env.TYPEA_SIGN_TOKEN) {
      throw new ApiError('CDN signing is not configured', 503);
    }

    // 1. Verify file exists in DB
    const { data: file, error } = await supabase
      .from('files')
      .select('key, status')
      .eq('key', key)
      .single();

    if (error || !file) {
      throw new ApiError('File not found', 404);
    }

    if (file.status === 'deleted') {
      throw new ApiError('File has been deleted', 410);
    }

    // 2. Generate Signed URL (5 minutes validity)
    const signedUrl = cdnSigner.generateSignedUrl(key);

    return successResponse({
      url: signedUrl,
      expiresIn: 300
    }, 'Signed URL generated successfully');

  } catch (error) {
    return handleApiError(error);
  }
}
