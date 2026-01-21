
import { IPToolbox } from '@/components/features/IPToolbox';
import { useTranslations } from 'next-intl';

export default function IPPage() {
  const t = useTranslations('IP');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <IPToolbox />
    </div>
  );
}
