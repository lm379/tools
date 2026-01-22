'use client';

import { useState } from 'react';
import { Copy, ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SymmetricCryptoService, RsaService, SymmetricAlgorithm, SymmetricMode, SymmetricPadding, CharacterEncoding, OutputFormat } from '@/lib/crypto';

export function EncryptionForm() {
  const t = useTranslations('Encryption');
  const [input, setInput] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // Settings
  const [algorithm, setAlgorithm] = useState<SymmetricAlgorithm | 'RSA'>('AES');
  const [cipherMode, setCipherMode] = useState<SymmetricMode>('CBC');
  const [padding, setPadding] = useState<SymmetricPadding>('Pkcs7');
  const [rsaKeySize, setRsaKeySize] = useState<1024 | 2048 | 4096>(2048);
  const [isGenerating, setIsGenerating] = useState(false);

  // Encoding Settings
  const [inputEncoding, setInputEncoding] = useState<CharacterEncoding>('UTF-8');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('Base64');

  const handleProcess = async (action: 'encrypt' | 'decrypt') => {
    setError('');
    setOutput('');

    if (!input) return;
    if (!secretKey) {
      setError(t('errorKey'));
      return;
    }

    try {
      if (algorithm === 'RSA') {
        if (action === 'encrypt') {
          const result = await RsaService.encrypt(input, secretKey, {
            outputFormat: outputFormat
          });
          setOutput(result);
        } else {
          const result = await RsaService.decrypt(input, secretKey, {
            inputFormat: outputFormat, // Assuming input format matches output format selection for decryption
            outputEncoding: inputEncoding
          });
          setOutput(result);
        }
      } else {
        if (action === 'encrypt') {
          const result = await SymmetricCryptoService.encrypt(input, secretKey, {
            algorithm: algorithm as SymmetricAlgorithm,
            mode: cipherMode,
            padding: padding,
            keyFormat: 'text',
            outputFormat: outputFormat,
            inputEncoding: inputEncoding
          });
          setOutput(result.content);
        } else {
          const result = await SymmetricCryptoService.decrypt(input, secretKey, {
            algorithm: algorithm as SymmetricAlgorithm,
            mode: cipherMode,
            padding: padding,
            keyFormat: 'text',
            inputFormat: outputFormat, // Assuming input format matches output format selection for decryption
            outputEncoding: inputEncoding
          });
          setOutput(result);
        }
      }
    } catch (err) {
      setError(t('errorProcess'));
      console.error(err);
    }
  };

  const handleGenerateKeys = async () => {
    if (algorithm !== 'RSA') return;
    setIsGenerating(true);
    try {
      const keys = await RsaService.generateKeyPair(rsaKeySize);
      setInput(`--- PUBLIC KEY ---\n${keys.publicKey}\n\n--- PRIVATE KEY ---\n${keys.privateKey}`);
      setSecretKey(keys.publicKey);
    } catch (err) {
      console.error(err);
      setError('Failed to generate keys');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  const swapText = () => {
    const tempInput = input;
    setInput(output);
    setOutput(tempInput);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Settings Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4">
        {/* Algorithm Group */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">{t('algorithm')}</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as any)}
            className="h-9 px-2 rounded-md border border-input bg-background text-sm min-w-[100px]"
          >
            <option value="AES">AES</option>
            <option value="DES">DES</option>
            <option value="3DES">3DES</option>
            <option value="Blowfish">Blowfish</option>
            <option value="RSA">RSA</option>
          </select>
        </div>

        {algorithm === 'RSA' ? (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">{t('rsa.keySize')}</label>
            <select
              value={rsaKeySize}
              onChange={(e) => setRsaKeySize(Number(e.target.value) as any)}
              className="h-9 px-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="1024">1024 bit</option>
              <option value="2048">2048 bit</option>
              <option value="4096">4096 bit</option>
            </select>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t('mode')}</label>
              <select
                value={cipherMode}
                onChange={(e) => setCipherMode(e.target.value as any)}
                className="h-9 px-2 rounded-md border border-input bg-background text-sm min-w-[80px]"
              >
                <option value="CBC">CBC</option>
                <option value="ECB">ECB</option>
                {algorithm === 'AES' && <option value="GCM">GCM</option>}
                <option value="CTR">CTR</option>
                <option value="CFB">CFB</option>
                <option value="OFB">OFB</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">{t('padding')}</label>
              <select
                value={padding}
                onChange={(e) => setPadding(e.target.value as any)}
                className="h-9 px-2 rounded-md border border-input bg-background text-sm min-w-[100px]"
              >
                <option value="Pkcs7">Pkcs7</option>
                <option value="ZeroPadding">ZeroPadding</option>
                <option value="NoPadding">NoPadding</option>
              </select>
            </div>
          </>
        )}

        {/* Secret Key - Flex Grow to take remaining space */}
        <div className="flex-1 flex items-center gap-2 min-w-[200px]">
          <label className="text-sm font-medium whitespace-nowrap">
            {algorithm === 'RSA' ? (
              <div className="flex items-center gap-2">
                <span>{t('rsa.privateKey')}</span>
                <button onClick={handleGenerateKeys} disabled={isGenerating} className="text-xs text-primary hover:underline">
                  {isGenerating ? '...' : t('rsa.generateKeys')}
                </button>
              </div>
            ) : t('secretKey')}
          </label>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={algorithm === 'RSA' ? 'PEM Key' : t('enterSecretKey')}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('inputText')}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('enterTextEncrypt')}
          className="w-full min-h-[200px] rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      {/* Middle Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3">

        {/* Left: Encodings */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-semibold">{t('encoding')}</span>
            <select
              value={inputEncoding}
              onChange={(e) => setInputEncoding(e.target.value as any)}
              className="h-8 px-2 rounded border border-input bg-background text-xs"
            >
              <option value="UTF-8">UTF-8</option>
              <option value="ASCII">ASCII</option>
              <option value="GBK">GBK</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-semibold">{t('format')}</span>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as any)}
              className="h-8 px-2 rounded border border-input bg-background text-xs"
            >
              <option value="Base64">Base64</option>
              <option value="Hex">Hex</option>
            </select>
          </div>
        </div>

        {/* Center/Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={swapText}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Swap Input/Output"
          >
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => handleProcess('encrypt')}
              className="h-9 px-6 rounded-md border border-primary bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              {t('encrypt')}
            </button>
            <button
              onClick={() => handleProcess('decrypt')}
              className="h-9 px-6 rounded-md border border-input bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 active:scale-95 transition-all shadow-sm"
            >
              {t('decrypt')}
            </button>
          </div>
        </div>
      </div>

      {/* Output Area */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">{t('output')}</label>
          {output && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          )}
        </div>
        <textarea
          readOnly
          value={output}
          className="w-full min-h-[200px] rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm focus:outline-none resize-y font-mono"
        />
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
