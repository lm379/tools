import type { MetadataRoute } from 'next';

/**
 * robots.txt for the toolkit site.
 *
 * Placed at src/app/robots.ts (NOT under [locale]) so it is served from the
 * site root as /robots.txt, independent of the next-intl locale routing.
 *
 * The middleware short-circuits any path whose last segment contains a dot,
 * so /robots.txt bypasses the locale redirect and is served directly.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Route Handlers — no indexable content, just JSON responses.
          '/api/',
          // User-uploaded file share links. These are ephemeral (TTL 1min–7d)
          // and private; indexing them leaks user files to search engines.
          '/files/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
