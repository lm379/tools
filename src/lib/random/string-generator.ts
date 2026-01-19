import { randomInt } from 'crypto';
import { IStringGenerator, RandomStringOptions } from './types';

export class RandomStringGenerator implements IStringGenerator {
  private static instance: RandomStringGenerator;

  // Default charsets
  private static readonly CHARSETS = {
    NUMBERS: '0123456789',
    LOWER: 'abcdefghijklmnopqrstuvwxyz',
    UPPER: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    SPECIAL: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  private constructor() {}

  public static getInstance(): RandomStringGenerator {
    if (!RandomStringGenerator.instance) {
      RandomStringGenerator.instance = new RandomStringGenerator();
    }
    return RandomStringGenerator.instance;
  }

  public generate(length: number, options: RandomStringOptions = {}): string {
    if (length < 0) {
      throw new Error('Length must be non-negative');
    }
    if (length === 0) {
      return '';
    }

    const charset = this.getCharset(options);
    if (charset.length === 0) {
      throw new Error('Charset cannot be empty');
    }

    const mode = options.mode || 'secure';
    let result = '';

    // Optimization for performance: pre-allocate array if possible, but string concat is often fast enough in V8 for reasonable lengths.
    // For very large lengths, an array join might be faster.
    const chars: string[] = new Array(length);

    for (let i = 0; i < length; i++) {
      let index: number;
      if (mode === 'pseudo') {
        index = Math.floor(Math.random() * charset.length);
      } else {
        index = randomInt(0, charset.length);
      }
      chars[i] = charset[index];
    }

    return chars.join('');
  }

  private getCharset(options: RandomStringOptions): string {
    if (options.charset !== undefined) {
      return this.filterExclude(options.charset, options.exclude);
    }

    const { strength = 'medium' } = options;
    let baseCharset = '';

    switch (strength) {
      case 'weak':
        // Numbers + Lowercase
        baseCharset = RandomStringGenerator.CHARSETS.LOWER + RandomStringGenerator.CHARSETS.NUMBERS;
        break;
      case 'strong':
        // All
        baseCharset = 
          RandomStringGenerator.CHARSETS.LOWER + 
          RandomStringGenerator.CHARSETS.UPPER + 
          RandomStringGenerator.CHARSETS.NUMBERS + 
          RandomStringGenerator.CHARSETS.SPECIAL;
        break;
      case 'medium':
      default:
        // Mixed case + Numbers
        baseCharset = 
          RandomStringGenerator.CHARSETS.LOWER + 
          RandomStringGenerator.CHARSETS.UPPER + 
          RandomStringGenerator.CHARSETS.NUMBERS;
        break;
    }

    return this.filterExclude(baseCharset, options.exclude);
  }

  private filterExclude(charset: string, exclude?: string): string {
    if (!exclude) return charset;
    // Using Set for O(1) lookup during filtering
    const excludeSet = new Set(exclude.split(''));
    // Filter out excluded characters
    return charset.split('').filter(c => !excludeSet.has(c)).join('');
  }
}

export const randomStringGenerator = RandomStringGenerator.getInstance();
