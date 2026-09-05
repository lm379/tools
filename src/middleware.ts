import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip all paths that should not be internationalized.
  //
  // Critical for EdgeOne Makers: without the negative lookahead, requests to
  // /_next/static/* (CSS / JS / fonts built by Next.js) get 307-redirected to
  // /<locale>/_next/static/* by next-intl's middleware, and the browser never
  // receives the assets — styles vanish completely.
  //
  // The exclusion list mirrors next-intl's official recommendation:
  //   - api        → Next.js Route Handlers
  //   - _next      → built assets (_next/static, _next/image, …)
  //   - _vercel    → Vercel internals (no-op on EdgeOne, harmless)
  //   - .*\..*     → any path containing a dot (favicon.ico, robots.txt, …)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
