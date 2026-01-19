import { successResponse, errorResponse, ApiError, handleApiError } from './api-response';
import { NextResponse } from 'next/server';

describe('Api Response Helper', () => {
  it('should create a success response with correct structure', async () => {
    const data = { id: 1, name: 'test' };
    const response = successResponse(data, 'Operation successful', 201);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({
      status: 'success',
      code: 201,
      message: 'Operation successful',
      data,
      timestamp: expect.any(String),
    });
  });

  it('should create an error response with correct structure', async () => {
    const response = errorResponse('Something went wrong', 400, { details: 'error' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      status: 'error',
      code: 400,
      message: 'Something went wrong',
      data: { details: 'error' },
      timestamp: expect.any(String),
    });
  });

  it('should handle ApiError correctly', async () => {
    const error = new ApiError('Custom error', 403, { reason: 'forbidden' });
    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      status: 'error',
      code: 403,
      message: 'Custom error',
      data: { reason: 'forbidden' },
      timestamp: expect.any(String),
    });
  });

  it('should handle generic Error correctly', async () => {
    const error = new Error('Generic error');
    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      status: 'error',
      code: 500,
      message: 'Generic error',
      data: null,
      timestamp: expect.any(String),
    });
  });
});
