'use client';

import { Link } from '@/i18n/routing';
import { Lock, FileCode, QrCode, ArrowRight, Dices } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Home');

  const features = [
    {
      key: "encryption",
      icon: Lock,
      href: "/encryption",
      color: "text-blue-500",
    },
    {
      key: "encoding",
      icon: FileCode,
      href: "/encoding",
      color: "text-green-500",
    },
    {
      key: "qrcode",
      icon: QrCode,
      href: "/qrcode",
      color: "text-purple-500",
    },
    {
      key: "random",
      icon: Dices,
      href: "/random",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          {t('title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group relative overflow-hidden rounded-sm border border-black/10 dark:border-white/10 bg-background p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col space-y-4">
              <div className={`p-3 w-fit rounded-full bg-secondary ${feature.color} bg-opacity-10`}>
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold">{t(`features.${feature.key}.title`)}</h3>
              <p className="text-muted-foreground">{t(`features.${feature.key}.description`)}</p>
              <div className="flex items-center text-sm font-medium pt-2 group-hover:underline">
                {t('tryNow')} <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
