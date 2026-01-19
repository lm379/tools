export type RandomMode = 'secure' | 'pseudo';

export interface RandomNumberOptions {
  mode?: RandomMode;
}

export interface RandomStringOptions {
  length?: number;
  charset?: string;
  exclude?: string;
  strength?: 'weak' | 'medium' | 'strong';
  mode?: RandomMode;
}

export interface IRandomGenerator {
  nextInt(min: number, max: number, options?: RandomNumberOptions): number;
  nextFloat(min: number, max: number, options?: RandomNumberOptions): number;
  batch<T>(count: number, generator: () => T): T[];
}

export interface IStringGenerator {
  generate(length: number, options?: RandomStringOptions): string;
}
