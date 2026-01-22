import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cdnSigner } from '@/lib/cdn-signer';
import { BUCKET_NAME } from '@/lib/aws-s3';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  // Extract info for logging
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;
  const referer = request.headers.get('referer') || undefined;

  if (!id) {
    return new NextResponse('File ID Required', { status: 400 });
  }

  try {
    // 1. Get file record with metadata
    const { data: file, error } = await supabase
      .from('files')
      .select('key, expires_at, status, metadata')
      .eq('id', id)
      .single();

    if (error || !file) {
      // Log Failure
      logger.log({
        type: 'access',
        file_id: id,
        status: 'failed',
        error_message: 'File not found',
        ip, 
        user_agent: userAgent, 
        referer
      });
      return new NextResponse('File Not Found', { status: 404 });
    }

    // 2. Check Expiration
    const now = new Date();
    const expiresAt = new Date(file.expires_at);

    if (now > expiresAt || file.status === 'deleted') {
      // Log Failure (Expired)
       logger.log({
        type: 'access',
        file_id: id,
        file_key: file.key,
        file_name: file.metadata?.originalName,
        status: 'failed',
        error_message: 'File expired or deleted',
        ip, 
        user_agent: userAgent, 
        referer
      });
      return new NextResponse('Gone: File has expired', { status: 410 });
    }

    // Log Success (Async)
    logger.log({
      type: 'access',
      file_id: id,
      file_key: file.key,
      file_name: file.metadata?.originalName,
      mime_type: file.metadata?.contentType,
      file_size: file.metadata?.size,
      status: 'success',
      ip, 
      user_agent: userAgent, 
      referer
    });

    // 3. Generate Token and Redirect
    // If CDN_DOMAIN is configured, redirect to CDN with token
    if (process.env.CDN_DOMAIN && process.env.TYPEA_SIGN_TOKEN) {
      // Generate a short-lived token (5 minutes)
      const signedUrl = cdnSigner.generateSignedUrl(file.key, 300);
      return NextResponse.redirect(signedUrl, 302);
    } else {
      // Fallback to S3 Public URL if CDN not configured
      const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${file.key}`;
      return NextResponse.redirect(s3Url, 302);
    }

  } catch (error) {
    console.error('File Redirect Error:', error);
    // Log System Error
    logger.log({
      type: 'access',
      file_id: id,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Internal Error',
      ip, 
      user_agent: userAgent, 
      referer
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
