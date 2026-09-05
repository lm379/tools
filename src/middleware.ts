import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// EdgeOne Makers' Next.js runtime does not honor the `matcher` config below —
// the middleware function runs for every request, including /_next/static/*
// (CSS / JS / fonts) and /api/*. Without short-circuiting here, next-intl
// would 307-redirect /_next/static/css/<hash>.css to /<locale>/_next/... and
// the browser would never receive the bundle — all styles vanish.
//
// We keep the `matcher` too for non-EdgeOne runtimes (Vercel, self-hosted),
// where it is honored and saves the function invocation cost on static assets.
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Skip Next.js built assets (_next/static, _next/image, …).
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }
  // 2) Skip Route Handlers — they are not internationalized.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  // 3) Skip the file-share redirect route /files/[id] — these short public
  //    links must NOT be locale-redirected, otherwise /files/<uuid> 307s to
  //    /<locale>/files/<uuid> and the redirect chain breaks.
  if (pathname.startsWith('/files')) {
    return NextResponse.next();
  }
  // 4) Skip any path with a dot (favicon.ico, robots.txt, sitemap.xml, …).
  if (pathname.lastIndexOf('.') > pathname.lastIndexOf('/')) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // Mirror the in-function short-circuit so runtimes that honor matcher
  // (Vercel / standard Next.js) skip the invocation entirely.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
