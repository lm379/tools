import { EncryptionForm } from '@/components/features/EncryptionForm';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Encryption' });
  return {
    title: t('title'),
    description: t('description')
  };
}

export default function EncryptionPage() {
  const t = useTranslations('Encryption');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded-sm p-6 bg-card min-h-[500px]">
        <EncryptionForm />
      </div>
    </div>
  );
}
