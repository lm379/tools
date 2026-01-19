import { RandomNumberOptions, RandomStringOptions } from './types';

// Constants
const CHARSETS = {
  NUMBERS: '0123456789',
  LOWER: 'abcdefghijklmnopqrstuvwxyz',
  UPPER: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  SPECIAL: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Helper: Secure Random Float [0, 1)
function getSecureRandom(): number {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return arr[0] / (0xffffffff + 1);
}

// Helper: Secure Random Int [min, max)
function getSecureRandomInt(min: number, max: number): number {
  return Math.floor(getSecureRandom() * (max - min)) + min;
}

// Browser implementation of Random Number Generator
export const browserRandomNumberGenerator = {
  nextInt(min: number, max: number, options: RandomNumberOptions = { mode: 'secure' }): number {
    if (min >= max) throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);

    if (options.mode === 'pseudo') {
      return Math.floor(Math.random() * (max - min)) + min;
    }
    return getSecureRandomInt(min, max);
  },

  nextFloat(min: number, max: number, options: RandomNumberOptions = { mode: 'secure' }): number {
    if (min >= max) throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);

    if (options.mode === 'pseudo') {
      return Math.random() * (max - min) + min;
    }
    return getSecureRandom() * (max - min) + min;
  },

  batch<T>(count: number, generator: () => T): T[] {
    if (count < 0) throw new Error('Batch count must be non-negative');
    const result: T[] = new Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = generator();
    }
    return result;
  }
};

// Browser implementation of Random String Generator
export const browserRandomStringGenerator = {
  generate(length: number, options: RandomStringOptions = {}): string {
    if (length < 0) throw new Error('Length must be non-negative');
    if (length === 0) return '';

    const charset = getCharset(options);
    if (charset.length === 0) throw new Error('Charset cannot be empty');

    const mode = options.mode || 'secure';
    const chars: string[] = new Array(length);

    for (let i = 0; i < length; i++) {
      let index: number;
      if (mode === 'pseudo') {
        index = Math.floor(Math.random() * charset.length);
      } else {
        index = getSecureRandomInt(0, charset.length);
      }
      chars[i] = charset[index];
    }

    return chars.join('');
  }
};

function getCharset(options: RandomStringOptions): string {
  if (options.charset !== undefined) {
    return filterExclude(options.charset, options.exclude);
  }

  const { strength = 'medium' } = options;
  let baseCharset = '';

  switch (strength) {
    case 'weak':
      baseCharset = CHARSETS.LOWER + CHARSETS.NUMBERS;
      break;
    case 'strong':
      baseCharset = CHARSETS.LOWER + CHARSETS.UPPER + CHARSETS.NUMBERS + CHARSETS.SPECIAL;
      break;
    case 'medium':
    default:
      baseCharset = CHARSETS.LOWER + CHARSETS.UPPER + CHARSETS.NUMBERS;
      break;
  }

  return filterExclude(baseCharset, options.exclude);
}

function filterExclude(charset: string, exclude?: string): string {
  if (!exclude) return charset;
  const excludeSet = new Set(exclude.split(''));
  return charset.split('').filter(c => !excludeSet.has(c)).join('');
}
