'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { browserRandomNumberGenerator, browserRandomStringGenerator } from '@/lib/random/browser';

type Strength = 'weak' | 'medium' | 'strong';
type RandomMode = 'secure' | 'pseudo';

interface RandomStringState {
  length: number;
  count: number;
  strength: Strength;
  charset: string;
  exclude: string;
  mode: RandomMode;
  results: string[];
}

interface RandomNumberState {
  min: number;
  max: number;
  count: number;
  isFloat: boolean;
  mode: RandomMode;
  results: number[];
}

export function RandomGenerator() {
  const t = useTranslations('Random');
  const [activeTab, setActiveTab] = useState<'string' | 'number'>('string');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [stringState, setStringState] = useState<RandomStringState>({
    length: 16,
    count: 1,
    strength: 'medium',
    charset: '',
    exclude: '',
    mode: 'secure',
    results: [],
  });

  const [numberState, setNumberState] = useState<RandomNumberState>({
    min: 1,
    max: 100,
    count: 1,
    isFloat: false,
    mode: 'secure',
    results: [],
  });

  const generateString = async () => {
    setLoading(true);
    setError(null);
    try {
      const { count, length, strength, charset, exclude, mode } = stringState;
      const options = {
        strength,
        charset: charset || undefined,
        exclude: exclude || undefined,
        mode,
      };

      let results: string[] = [];
      if (count > 1) {
        results = Array.from({ length: count }, () =>
          browserRandomStringGenerator.generate(length, options)
        );
      } else {
        results = [browserRandomStringGenerator.generate(length, options)];
      }

      setStringState(prev => ({ ...prev, results }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateNumber = async () => {
    setLoading(true);
    setError(null);
    try {
      const { count, min, max, isFloat, mode } = numberState;
      const options = {
        mode,
      };

      let results: number[] = [];
      if (isFloat) {
        if (count > 1) {
          results = browserRandomNumberGenerator.batch(count, () =>
            browserRandomNumberGenerator.nextFloat(min, max, options)
          );
        } else {
          results = [browserRandomNumberGenerator.nextFloat(min, max, options)];
        }
      } else {
        if (count > 1) {
          results = browserRandomNumberGenerator.batch(count, () =>
            browserRandomNumberGenerator.nextInt(min, max, options)
          );
        } else {
          results = [browserRandomNumberGenerator.nextInt(min, max, options)];
        }
      }

      setNumberState(prev => ({ ...prev, results }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
  const labelClass = "block text-sm font-medium mb-1.5";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Tabs - Updated to match QRCodeGenerator style */}
      <div className="flex gap-2 bg-muted/30 p-1.5 rounded-xl backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('string')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'string'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('tabs.string')}
        </button>
        <button
          onClick={() => setActiveTab('number')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'number'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('tabs.number')}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-6">
          {activeTab === 'string' ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t('string.mode')}</label>
                  <select
                    value={stringState.mode}
                    onChange={(e) => setStringState({ ...stringState, mode: e.target.value as RandomMode })}
                    className={inputClass}
                  >
                    <option value="secure">{t('string.modes.secure')}</option>
                    <option value="pseudo">{t('string.modes.pseudo')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('string.length')}</label>
                  <input
                    type="number"
                    min="1"
                    max="1024"
                    value={stringState.length}
                    onChange={(e) => setStringState({ ...stringState, length: parseInt(e.target.value) || 16 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('string.count')}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={stringState.count}
                    onChange={(e) => setStringState({ ...stringState, count: parseInt(e.target.value) || 1 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('string.strength')}</label>
                  <select
                    value={stringState.strength}
                    onChange={(e) => setStringState({ ...stringState, strength: e.target.value as Strength })}
                    className={inputClass}
                  >
                    <option value="weak">{t('string.strengths.weak')}</option>
                    <option value="medium">{t('string.strengths.medium')}</option>
                    <option value="strong">{t('string.strengths.strong')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('string.charset')}</label>
                  <input
                    type="text"
                    value={stringState.charset}
                    onChange={(e) => setStringState({ ...stringState, charset: e.target.value })}
                    placeholder={t('string.charsetPlaceholder')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('string.exclude')}</label>
                  <input
                    type="text"
                    value={stringState.exclude}
                    onChange={(e) => setStringState({ ...stringState, exclude: e.target.value })}
                    placeholder={t('string.excludePlaceholder')}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                onClick={generateString}
                disabled={loading}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('string.generate')}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t('string.mode')}</label>
                  <select
                    value={numberState.mode}
                    onChange={(e) => setNumberState({ ...numberState, mode: e.target.value as RandomMode })}
                    className={inputClass}
                  >
                    <option value="secure">{t('string.modes.secure')}</option>
                    <option value="pseudo">{t('string.modes.pseudo')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t('number.min')}</label>
                    <input
                      type="number"
                      value={numberState.min}
                      onChange={(e) => setNumberState({ ...numberState, min: parseFloat(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('number.max')}</label>
                    <input
                      type="number"
                      value={numberState.max}
                      onChange={(e) => setNumberState({ ...numberState, max: parseFloat(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('number.count')}</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={numberState.count}
                    onChange={(e) => setNumberState({ ...numberState, count: parseInt(e.target.value) || 1 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={numberState.isFloat}
                      onChange={(e) => setNumberState({ ...numberState, isFloat: e.target.checked })}
                      className="rounded border-input text-primary shadow-sm focus:border-ring focus:ring focus:ring-ring focus:ring-opacity-50"
                    />
                    <span className="text-sm font-medium">{t('number.float')}</span>
                  </label>
                </div>
              </div>
              <button
                onClick={generateNumber}
                disabled={loading}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('number.generate')}
              </button>
            </>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Results - Updated layout to match QRCodeGenerator right panel style */}
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4">{t('results')}</h3>
          <div className="flex-1 rounded-lg border border-input bg-muted/50 p-4 overflow-auto custom-scrollbar min-h-[300px] max-h-[600px]">
            {(activeTab === 'string' ? stringState.results : numberState.results).length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">
                {t('results')}...
              </div>
            ) : (
              <div className="space-y-2">
                {(activeTab === 'string' ? stringState.results : numberState.results).map((result, idx) => (
                  <div 
                    key={idx} 
                    className="group relative p-3 bg-background rounded-md border border-input break-all font-mono text-sm transition-all hover:border-ring shadow-sm"
                  >
                    {result}
                    <button
                      onClick={() => handleCopy(String(result), idx)}
                      className="absolute right-2 top-2 p-1.5 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 bg-background border shadow-sm"
                      title={t('string.copy')}
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
