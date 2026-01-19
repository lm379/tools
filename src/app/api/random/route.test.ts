/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Random API Route', () => {
  it('should generate random number', async () => {
    const req = new NextRequest('http://localhost/api/random', {
      method: 'POST',
      body: JSON.stringify({
        type: 'number',
        min: 1,
        max: 10,
        count: 1
      })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.result).toBe('number');
    expect(data.result).toBeGreaterThanOrEqual(1);
    expect(data.result).toBeLessThan(10);
  });

  it('should generate random string', async () => {
    const req = new NextRequest('http://localhost/api/random', {
      method: 'POST',
      body: JSON.stringify({
        type: 'string',
        length: 10,
        count: 1
      })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.result).toBe('string');
    expect(data.result).toHaveLength(10);
  });

  it('should handle batch generation', async () => {
    const req = new NextRequest('http://localhost/api/random', {
      method: 'POST',
      body: JSON.stringify({
        type: 'number',
        min: 1,
        max: 10,
        count: 5
      })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.result)).toBe(true);
    expect(data.result).toHaveLength(5);
  });

  it('should handle pseudo mode', async () => {
    const req = new NextRequest('http://localhost/api/random', {
      method: 'POST',
      body: JSON.stringify({
        type: 'number',
        min: 1,
        max: 10,
        count: 1,
        options: { mode: 'pseudo' }
      })
    });
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(typeof data.result).toBe('number');
  });

  it('should validate inputs', async () => {
    const req = new NextRequest('http://localhost/api/random', {
      method: 'POST',
      body: JSON.stringify({
        type: 'number',
        min: 10,
        max: 5 // Invalid range
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(500); // Or 400 if validation was explicit in route, currently library throws error
  });
});
