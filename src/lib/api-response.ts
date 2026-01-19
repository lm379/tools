import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  status: 'success' | 'error';
  code: number;
  message: string;
  data: T | null;
  timestamp: string;
};

export class ApiError extends Error {
  code: number;
  data: any;

  constructor(message: string, code: number = 500, data: any = null) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = 'ApiError';
  }
}

export function successResponse<T>(data: T, message: string = 'Success', code: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      status: 'success',
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: code }
  );
}

export function errorResponse(message: string = 'Internal Server Error', code: number = 500, data: any = null): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      status: 'error',
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: code }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return errorResponse(error.message, error.code, error.data);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse('An unexpected error occurred', 500);
}
