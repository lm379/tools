import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

/**
 * sitemap.xml for the toolkit site.
 *
 * Placed at src/app/sitemap.ts (NOT under [locale]) so it is served from the
 * site root as /sitemap.xml, independent of the next-intl locale routing.
 *
 * The middleware short-circuits any path whose last segment contains a dot,
 * so /sitemap.xml bypasses the locale redirect and is served directly.
 *
 * Every URL is emitted once per locale with hreflang alternates so search
 * engines can serve the right language version.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Tool pages under src/app/[locale]/. Keep in sync when adding/removing pages.
// Deliberately excludes /files/[id] (ephemeral user uploads, disallowed in robots).
const TOOL_PAGES = ['encoding', 'encryption', 'ip', 'qrcode', 'random'];

type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

interface PageEntry {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}

const PAGES: PageEntry[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  ...TOOL_PAGES.map((page) => ({
    path: `/${page}`,
    priority: 0.8,
    changeFrequency: 'monthly' as ChangeFrequency,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { locales } = routing;
  const now = new Date();

  const urlFor = (locale: string, path: string) =>
    `${SITE_URL}/${locale}${path}`;

  return PAGES.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: urlFor(locale, path),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, urlFor(l, path)])
        ),
      },
    }))
  );
}
