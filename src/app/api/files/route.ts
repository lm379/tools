import { NextRequest } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/aws-s3';
import { successResponse, handleApiError, ApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      throw new ApiError('Filename and Content-Type are required', 400);
    }

    if (!BUCKET_NAME) {
      throw new ApiError('AWS Bucket Name is not configured', 500);
    }

    const uniqueFilename = `${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${uniqueFilename}`;

    return successResponse({
      uploadUrl: signedUrl,
      publicUrl: publicUrl,
      key: uniqueFilename
    }, 'Upload URL generated successfully', 201);

  } catch (error) {
    return handleApiError(error);
  }
}
