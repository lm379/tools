'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

type TabType = 'base64' | 'url' | 'number' | 'signed';

export function EncodingConverter() {
  const t = useTranslations('Encoding');
  const [activeTab, setActiveTab] = useState<TabType>('base64');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('base64')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize whitespace-nowrap ${
            activeTab === 'base64'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('base64Converter')}
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize whitespace-nowrap ${
            activeTab === 'url'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('urlConverter')}
        </button>
        <button
          onClick={() => setActiveTab('number')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize whitespace-nowrap ${
            activeTab === 'number'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('numberBase')}
        </button>
        <button
          onClick={() => setActiveTab('signed')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 capitalize whitespace-nowrap ${
            activeTab === 'signed'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('signedConverter')}
        </button>
      </div>

      <div className="bg-card border border-black/10 dark:border-white/10 rounded-sm p-6">
        {activeTab === 'base64' && <Base64Converter />}
        {activeTab === 'url' && <UrlConverter />}
        {activeTab === 'number' && <NumberBaseConverter />}
        {activeTab === 'signed' && <SignedNumberConverter />}
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
  placeholder,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        {placeholder && (
          <span className="text-xs text-muted-foreground hidden sm:inline-block opacity-70">
            {placeholder}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          ref={inputRef}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
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

function SignedNumberConverter() {
  const t = useTranslations('Encoding');
  const [decimalInput, setDecimalInput] = useState('');
  const [bitWidth, setBitWidth] = useState<8 | 16 | 32 | 64>(8);
  const [outputMode, setOutputMode] = useState<'auto' | 'bin' | 'hex'>('auto');
  const inputMeasureRef = useRef<HTMLInputElement | null>(null);
  const [maxDisplayChars, setMaxDisplayChars] = useState(50);
  const [values, setValues] = useState({
    decimal: '',
    signMagnitude: '',
    onesComplement: '',
    twosComplement: '',
    excess: '',
  });

  useEffect(() => {
    const el = inputMeasureRef.current;
    if (!el || typeof window === 'undefined') return;

    const updateMaxChars = () => {
      const style = window.getComputedStyle(el);
      const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = font;

      const charWidth = ctx.measureText('0').width || 8;
      const paddingLeft = parseFloat(style.paddingLeft || '0');
      const paddingRight = parseFloat(style.paddingRight || '0');
      const availableWidth = Math.max(0, el.clientWidth - paddingLeft - paddingRight);
      const chars = Math.max(8, Math.floor(availableWidth / charWidth));

      setMaxDisplayChars(chars);
    };

    updateMaxChars();

    const ro = new ResizeObserver(() => updateMaxChars());
    ro.observe(el);
    window.addEventListener('resize', updateMaxChars);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateMaxChars);
    };
  }, []);

  // Helper to format binary with spaces
  const formatBinary = (bin: string) => {
    if (!bin || ['Overflow', 'N/A', 'Invalid Input'].includes(bin)) return bin;

    const formatted = bin.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();

    const toHex = () => {
      try {
        const clean = bin.replace(/\s/g, '');
        const val = BigInt('0b' + clean);
        const hexWidth = Math.ceil(clean.length / 4);
        return '0x' + val.toString(16).toUpperCase().padStart(hexWidth, '0');
      } catch {
        return formatted;
      }
    };

    if (outputMode === 'hex') return toHex();
    if (outputMode === 'bin') return formatted;

    // Auto convert to Hex if too long for the textbox width
    if (formatted.length > maxDisplayChars) {
      return toHex();
    }

    return formatted;
  };

  // Helper to remove spaces
  const cleanBinary = (bin: string) => bin.replace(/\s/g, '');

  // Helper to detect and parse input (Binary or Hex)
  const parseInput = (val: string, width: bigint): bigint | null => {
    const cleanVal = cleanBinary(val);
    
    // Check for Hex
    if (cleanVal.startsWith('0x') || cleanVal.startsWith('0X')) {
        try {
            const hexStr = cleanVal.slice(2);
            if (!/^[0-9a-fA-F]+$/.test(hexStr)) return null;
            const val = BigInt('0x' + hexStr);
            // Check if value fits in width? For signed inputs, we just take the bits.
            // But we need to make sure we treat it as the raw bits for that representation.
            return val;
        } catch {
            return null;
        }
    }

    // Check for Binary
    if (/^[01]+$/.test(cleanVal)) {
        if (cleanVal.length > width) return null;
        return BigInt('0b' + cleanVal);
    }

    return null;
  };

  // Generate all formats from a decimal value
  const generateValues = (val: bigint, width: bigint) => {
    const maxVal = (BigInt(1) << (width - BigInt(1))) - BigInt(1);
    const minVal = -BigInt(1) << (width - BigInt(1));
    const minSymVal = -(maxVal); // -127 for 8-bit

    const results = {
      decimal: val.toString(),
      signMagnitude: '',
      onesComplement: '',
      twosComplement: '',
      excess: '',
    };

    if (val > maxVal || val < minVal) {
      return {
        decimal: val.toString(),
        signMagnitude: 'Overflow',
        onesComplement: 'Overflow',
        twosComplement: 'Overflow',
        excess: 'Overflow',
      };
    }

    // Two's Complement (Standard)
    const twosCompVal = BigInt.asUintN(Number(width), val);
    results.twosComplement = formatBinary(twosCompVal.toString(2).padStart(Number(width), '0'));

    // Excess-K (Offset Binary)
    // Excess = Two's Complement with Sign Bit Toggled
    const twosCompStr = twosCompVal.toString(2).padStart(Number(width), '0');
    const excessStr = (twosCompStr[0] === '0' ? '1' : '0') + twosCompStr.slice(1);
    results.excess = formatBinary(excessStr);

    // Sign-Magnitude & One's Complement (Symmetric Range)
    if (val < minSymVal) {
       results.signMagnitude = 'Overflow';
       results.onesComplement = 'Overflow';
    } else {
      if (val >= BigInt(0)) {
        const bin = val.toString(2).padStart(Number(width), '0');
        results.signMagnitude = formatBinary(bin);
        results.onesComplement = formatBinary(bin);
      } else {
        // Negative
        const absVal = -val;
        const absStr = absVal.toString(2).padStart(Number(width) - 1, '0');
        
        // Sign-Mag: 1 + abs
        results.signMagnitude = formatBinary('1' + absStr);

        // One's Comp: 1 + inverted abs
        const onesCompStr = '1' + absStr.split('').map(b => b === '0' ? '1' : '0').join('');
        results.onesComplement = formatBinary(onesCompStr);
      }
    }

    return results;
  };

  // Re-calculate when bit width changes
  useEffect(() => {
    if (values.decimal && /^-?\d+$/.test(values.decimal)) {
      try {
        const val = BigInt(values.decimal);
        const newValues = generateValues(val, BigInt(bitWidth));
        setValues(newValues);
      } catch {
        // Ignore errors during resize
      }
    }
  }, [bitWidth]);

  // Re-calculate when output mode changes
  useEffect(() => {
    if (values.decimal && /^-?\d+$/.test(values.decimal)) {
      try {
        const val = BigInt(values.decimal);
        const newValues = generateValues(val, BigInt(bitWidth));
        setValues(newValues);
      } catch {
        // Ignore errors during mode switch
      }
    }
  }, [outputMode, bitWidth]);

  const handleChange = (type: keyof typeof values, value: string) => {
    // Allow user to type freely
    setValues(prev => ({ ...prev, [type]: value }));

    if (!value || value === '-') return;

    try {
      let decimalVal: bigint;
      const width = BigInt(bitWidth);
      
      if (type === 'decimal') {
        if (!/^-?\d+$/.test(value)) return;
        decimalVal = BigInt(value);
      } else {
        const rawVal = parseInput(value, width);
        if (rawVal === null) return;

        // Convert raw value (BigInt) to padded binary string for bit manipulation logic
        // This handles both Hex and Binary inputs uniformly
        const paddedVal = rawVal.toString(2).padStart(Number(width), '0');
        
        // If Hex input was too large for width, just take lower bits? 
        // Or should parseInput reject it? Currently parseInput returns BigInt.
        // We should truncate to width bits.
        const truncatedVal = BigInt.asUintN(Number(width), rawVal);
        const bitStr = truncatedVal.toString(2).padStart(Number(width), '0');
        
        const signBit = bitStr[0];
        const restBits = bitStr.slice(1);

        if (type === 'signMagnitude') {
           const magnitude = BigInt('0b' + restBits);
           decimalVal = signBit === '1' ? -magnitude : magnitude;
        } else if (type === 'onesComplement') {
           if (signBit === '0') {
             decimalVal = BigInt('0b' + restBits);
           } else {
             // Negative: invert bits -> magnitude
             const invertedRest = restBits.split('').map(c => c === '1' ? '0' : '1').join('');
             decimalVal = -BigInt('0b' + invertedRest);
           }
        } else if (type === 'twosComplement') {
            const unsigned = BigInt('0b' + bitStr);
            if (signBit === '1') {
                decimalVal = unsigned - (BigInt(1) << width);
            } else {
                decimalVal = unsigned;
            }
        } else if (type === 'excess') {
            const toggledSign = signBit === '1' ? '0' : '1';
            const realTwosComp = toggledSign + restBits;
            const unsigned = BigInt('0b' + realTwosComp);
            if (toggledSign === '1') {
                decimalVal = unsigned - (BigInt(1) << width);
            } else {
                decimalVal = unsigned;
            }
        } else {
            return;
        }
      }

      // Generate other values
      const generated = generateValues(decimalVal, width);
      
      // Update all EXCEPT the current one (to preserve cursor/formatting state)
      setValues(prev => ({
        ...generated,
        [type]: value
      }));

    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('bitWidth')}</label>
          <div className="flex gap-2">
            {[8, 16, 32, 64].map((width) => (
              <button
                key={width}
                onClick={() => setBitWidth(width as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  bitWidth === width
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {width}-bit
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('outputFormat')}</label>
          <div className="flex gap-2">
            {[
              { key: 'auto', label: t('outputAuto') },
              { key: 'bin', label: t('outputBinary') },
              { key: 'hex', label: t('outputHex') },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setOutputMode(item.key as 'auto' | 'bin' | 'hex')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  outputMode === item.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('enterDecimal')}</label>
          <input
            type="text"
            value={values.decimal}
            onChange={(e) => handleChange('decimal', e.target.value)}
            placeholder="-123"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        <NumberInput
          label={t('signMagnitude')}
          value={values.signMagnitude}
          onChange={(v) => handleChange('signMagnitude', v)}
          inputRef={inputMeasureRef}
          placeholder={t('binaryOrHex')}
        />
        <NumberInput
          label={t('onesComplement')}
          value={values.onesComplement}
          onChange={(v) => handleChange('onesComplement', v)}
          placeholder={t('binaryOrHex')}
        />
        <NumberInput
          label={t('twosComplement')}
          value={values.twosComplement}
          onChange={(v) => handleChange('twosComplement', v)}
          placeholder={t('binaryOrHex')}
        />
        <NumberInput
          label={t('excess')}
          value={values.excess}
          onChange={(v) => handleChange('excess', v)}
          placeholder={t('binaryOrHex')}
        />
      </div>
    </div>
  );
}