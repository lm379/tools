import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { successResponse, handleApiError, ApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool_type, metadata } = body;

    if (!tool_type) {
      throw new ApiError('Tool type is required', 400);
    }

    const { error } = await supabase
      .from('usage_logs')
      .insert([
        { 
          tool_type, 
          metadata,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      throw new ApiError(error.message, 500);
    }

    return successResponse({ logged: true }, 'Analytics logged successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
