'use client';

import { useState } from 'react';
import { EncryptionForm } from '@/components/features/EncryptionForm';
import { SignatureGenerator } from '@/components/features/SignatureGenerator';
import { useTranslations } from 'next-intl';
import { Lock, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EncryptionPage() {
  const t = useTranslations('Encryption');
  const tSig = useTranslations('Signature');
  const [activeTab, setActiveTab] = useState<'encryption' | 'signature'>('encryption');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="flex space-x-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setActiveTab('encryption')}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeTab === 'encryption'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
          )}
        >
          <Lock className="mr-2 h-4 w-4" />
          {t('title')}
        </button>
        <button
          onClick={() => setActiveTab('signature')}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeTab === 'signature'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
          )}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          {tSig('title')}
        </button>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded-sm p-6 bg-card min-h-[500px]">
        {activeTab === 'encryption' ? <EncryptionForm /> : <SignatureGenerator />}
      </div>
    </div>
  );
}
