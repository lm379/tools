import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

/**
 * Central SEO helpers for the App Router + next-intl setup.
 *
 * Why a helper instead of the `next-seo` plugin:
 * - `next-seo` targets the Pages Router; its App Router mode wraps pages in
 *   client components (<NextSeo>) which conflicts with next-intl's async
 *   server-side `generateMetadata`.
 * - The native Metadata API used here already produces per-locale robots.txt,
 *   sitemap.xml (with hreflang) and per-page metadata — the idiomatic "Next SEO"
 *   approach for App Router.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const SITE_NAME = 'DevTools';

// OpenGraph expects BCP-47-ish locales like "en_US"; map next-intl's "en"/"zh".
const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  zh: 'zh_CN',
};

export function localeOg(locale: string): string {
  return OG_LOCALE[locale] ?? locale;
}

export function buildAlternates(locale: string, path = ''): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages,
  };
}

/**
 * Build a full per-page Metadata object (canonical + hreflang, OpenGraph,
 * Twitter) for a tool page. The `title`/`description` strings are resolved by
 * the parent layout's `title.template` (%s - DevTools).
 */
export async function buildPageMetadata({
  locale,
  path = '',
  title,
  description,
}: {
  locale: string;
  path?: string;
  title: string;
  description: string;
}): Promise<Metadata> {
  const siteName =
    (await getTranslations({ locale, namespace: 'Metadata' }))('siteName') || SITE_NAME;
  const url = `${SITE_URL}/${locale}${path}`;
  const alternateLocale = routing.locales
    .filter((l) => l !== locale)
    .map(localeOg);

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      type: 'website',
      url,
      siteName,
      title,
      description,
      locale: localeOg(locale),
      alternateLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
