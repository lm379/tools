import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cdnSigner } from '@/lib/cdn-signer';
import { BUCKET_NAME } from '@/lib/aws-s3';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return new NextResponse('File ID Required', { status: 400 });
  }

  try {
    // 1. Get file record
    const { data: file, error } = await supabase
      .from('files')
      .select('key, expires_at, status')
      .eq('id', id)
      .single();

    if (error || !file) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    // 2. Check Expiration
    const now = new Date();
    const expiresAt = new Date(file.expires_at);

    if (now > expiresAt || file.status === 'deleted') {
      return new NextResponse('Gone: File has expired', { status: 410 });
    }

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
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
