import { useTranslations } from 'next-intl';
import { RandomGenerator } from '@/components/features/RandomGenerator';

export default function RandomPage() {
  const t = useTranslations('Random');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded-sm p-6 bg-card">
        <RandomGenerator />
      </div>
    </div>
  );
}
