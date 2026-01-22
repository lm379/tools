import { QRCodeGenerator } from '@/components/features/QRCodeGenerator';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'QRCode' });
  return {
    title: t('title'),
    description: t('description')
  };
}

export default function QRCodePage() {
  const t = useTranslations('QRCode');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <div className="border border-black/10 dark:border-white/10 rounded-sm p-6 bg-card">
        <QRCodeGenerator />
      </div>
    </div>
  );
}
