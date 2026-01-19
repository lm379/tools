import { EncodingConverter } from '@/components/features/EncodingConverter';
import { useTranslations } from 'next-intl';

export default function EncodingPage() {
  const t = useTranslations('Encoding');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <EncodingConverter />
    </div>
  );
}
