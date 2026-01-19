'use client';

import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

type TabType = 'base64' | 'url' | 'number';

export function EncodingConverter() {
  const t = useTranslations('Encoding');
  const [activeTab, setActiveTab] = useState<TabType>('base64');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('base64')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize ${
            activeTab === 'base64'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('base64Converter')}
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize ${
            activeTab === 'url'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('urlConverter')}
        </button>
        <button
          onClick={() => setActiveTab('number')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize ${
            activeTab === 'number'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('numberBase')}
        </button>
      </div>

      <div className="bg-card border border-black/10 dark:border-white/10 rounded-sm p-6">
        {activeTab === 'base64' && <Base64Converter />}
        {activeTab === 'url' && <UrlConverter />}
        {activeTab === 'number' && <NumberBaseConverter />}
      </div>
    </div>
  );
}

function Base64Converter() {
  const t = useTranslations('Encoding');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    try {
      if (!input) {
        setOutput('');
        return;
      }
      if (mode === 'encode') {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
    } catch {
      setOutput(t('invalidInput'));
    }
  }, [input, mode, t]);

  return (
    <ConverterLayout
      title={t('base64Converter')}
      mode={mode}
      setMode={setMode}
      input={input}
      setInput={setInput}
      output={output}
    />
  );
}

function UrlConverter() {
  const t = useTranslations('Encoding');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    try {
      if (!input) {
        setOutput('');
        return;
      }
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch {
      setOutput(t('invalidInput'));
    }
  }, [input, mode, t]);

  return (
    <ConverterLayout
      title={t('urlConverter')}
      mode={mode}
      setMode={setMode}
      input={input}
      setInput={setInput}
      output={output}
    />
  );
}

function NumberBaseConverter() {
  const t = useTranslations('Encoding');
  const [values, setValues] = useState({
    binary: '',
    octal: '',
    decimal: '',
    hex: '',
  });

  const handleChange = (type: keyof typeof values, value: string) => {
    if (!value) {
      setValues({ binary: '', octal: '', decimal: '', hex: '' });
      return;
    }

    try {
      let decimalValue: number;

      // Parse input to decimal first
      switch (type) {
        case 'binary':
          decimalValue = parseInt(value, 2);
          break;
        case 'octal':
          decimalValue = parseInt(value, 8);
          break;
        case 'decimal':
          decimalValue = parseInt(value, 10);
          break;
        case 'hex':
          decimalValue = parseInt(value, 16);
          break;
      }

      if (isNaN(decimalValue)) {
        // Just update the changed field to allow typing, but don't update others if invalid
        setValues((prev) => ({ ...prev, [type]: value }));
        return;
      }

      setValues({
        binary: decimalValue.toString(2),
        octal: decimalValue.toString(8),
        decimal: decimalValue.toString(10),
        hex: decimalValue.toString(16).toUpperCase(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <NumberInput
          label={t('decimal')}
          value={values.decimal}
          onChange={(v) => handleChange('decimal', v)}
        />
        <NumberInput
          label={t('hexadecimal')}
          value={values.hex}
          onChange={(v) => handleChange('hex', v)}
        />
        <NumberInput
          label={t('binary')}
          value={values.binary}
          onChange={(v) => handleChange('binary', v)}
        />
        <NumberInput
          label={t('octal')}
          value={values.octal}
          onChange={(v) => handleChange('octal', v)}
        />
      </div>
    </div>
  );
}

function ConverterLayout({
  mode,
  setMode,
  input,
  setInput,
  output,
}: {
  title: string;
  mode: 'encode' | 'decode';
  setMode: (m: 'encode' | 'decode') => void;
  input: string;
  setInput: (v: string) => void;
  output: string;
}) {
  const t = useTranslations('Encoding');
  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'encode'}
            onChange={() => setMode('encode')}
            className="w-4 h-4 text-primary"
          />
          <span>{t('encode')}</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'decode'}
            onChange={() => setMode('decode')}
            className="w-4 h-4 text-primary"
          />
          <span>{t('decode')}</span>
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('input')}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder={t('enterText', { mode: mode === 'encode' ? t('encode') : t('decode') })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('output')}</label>
          <div className="relative">
            <textarea
              readOnly
              value={output}
              className="flex min-h-[200px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {output && (
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="absolute top-2 right-2 p-2 hover:bg-background/80 rounded-md transition-all active:scale-95"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {value && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="absolute top-1 right-1 p-1.5 hover:bg-muted rounded-md transition-all active:scale-95"
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}