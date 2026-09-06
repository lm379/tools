import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/ui/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ClientToaster } from '@/components/ui/ClientToaster';
import { SITE_URL, SITE_NAME, buildAlternates, localeOg } from '@/lib/seo';

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('title'),
      template: `%s - ${t('siteName')}`
    },
    description: t('description'),
    applicationName: t('siteName'),
    alternates: buildAlternates(locale),
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: t('siteName'),
      title: t('title'),
      description: t('description'),
      locale: localeOg(locale),
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map(localeOg)
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description')
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: tMeta('description'),
    inLanguage: routing.locales
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <Header />
            <main className="container max-w-screen-2xl mx-auto py-6 px-4">
              {children}
            </main>
            <ClientToaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}