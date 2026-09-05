import { type NextRequest } from 'next/server';

/**
 * Extract the real client IP from a Next.js request, honoring EdgeOne Makers
 * and other reverse-proxy conventions.
 *
 * EdgeOne Makers sets `EO-Connecting-IP` to the IP that connected to the
 * EdgeOne edge node — that's the closest thing to the real client IP available.
 * The standard `X-Forwarded-For` header is also populated by EdgeOne, but when
 * the request traverses the EdgeOne CDN → origin chain it can end up holding an
 * internal EdgeOne hop IP rather than the original client IP. So we prefer
 * `EO-Connecting-IP` first and only fall back to `X-Forwarded-For`.
 *
 * Order of preference:
 *   1. eo-connecting-ip          (EdgeOne edge-client IP)
 *   2. x-real-ip                  (traditional reverse-proxy convention)
 *   3. cf-connecting-ip           (Cloudflare convention, harmless on EdgeOne)
 *   4. true-client-ip             (Cloudflare Enterprise / Akamai convention)
 *   5. x-forwarded-for[0]         (standard, multi-hop chain — leftmost)
 *   6. request.ip                 (Next.js fallback)
 *   7. 'unknown'
 */
export function getClientIp(request: NextRequest): string {
  const headers = request.headers;

  const eoConnectingIp = headers.get('eo-connecting-ip');
  if (eoConnectingIp) return eoConnectingIp.trim();

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const trueClientIp = headers.get('true-client-ip');
  if (trueClientIp) return trueClientIp.trim();

  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  if (request.ip) return request.ip;

  return 'unknown';
}
