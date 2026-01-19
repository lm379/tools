'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Key, User, FileText, Lock } from 'lucide-react';
import CryptoJS from 'crypto-js';

export function SignatureGenerator() {
  const t = useTranslations('Signature');
  
  const [path, setPath] = useState('');
  const [uid, setUid] = useState('0');
  const [privateKey, setPrivateKey] = useState('');
  const [signature, setSignature] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');

  const generateSignature = () => {
    setError('');
    
    if (!path || !privateKey) {
      setError(t('error'));
      return;
    }

    try {
      // Ensure path starts with /
      const uri = path.startsWith('/') ? path : `/${path}`;
      const timestamp = Math.floor(Date.now() / 1000);
      const rand = crypto.randomUUID().replace(/-/g, '');
      
      // Hash construction: URI-timestamp-rand-uid-PrivateKey
      const rawString = `${uri}-${timestamp}-${rand}-${uid}-${privateKey}`;
      const md5hash = CryptoJS.MD5(rawString).toString();
      
      const key = `${timestamp}-${rand}-${uid}-${md5hash}`;
      setSignature(key);
    } catch (err) {
      console.error(err);
      setError('Error generating signature');
    }
  };

  const copyToClipboard = () => {
    if (!signature) return;
    navigator.clipboard.writeText(signature);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="grid gap-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
        
        {/* Path Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('path')}
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder={t('pathPlaceholder')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* UID Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('uid')}
          </label>
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder={t('uidPlaceholder')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Private Key Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t('privateKey')}
          </label>
          <div className="relative">
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder={t('privateKeyPlaceholder')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
            />
            <Lock className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 font-medium">
            {error}
          </div>
        )}

        <button
          onClick={generateSignature}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          {t('generate')}
        </button>

        {/* Result */}
        {signature && (
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('result')}
            </label>
            <div className="relative group">
              <div className="min-h-[40px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm break-all font-mono">
                {signature}
              </div>
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-2 p-1.5 rounded-md hover:bg-background/80 transition-colors"
                title={t('copy')}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
