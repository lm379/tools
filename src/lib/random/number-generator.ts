import { randomInt, randomBytes } from 'crypto';
import { IRandomGenerator, RandomNumberOptions } from './types';

export class RandomNumberGenerator implements IRandomGenerator {
  private static instance: RandomNumberGenerator;

  private constructor() {}

  public static getInstance(): RandomNumberGenerator {
    if (!RandomNumberGenerator.instance) {
      RandomNumberGenerator.instance = new RandomNumberGenerator();
    }
    return RandomNumberGenerator.instance;
  }

  /**
   * Generates a random integer between min (inclusive) and max (exclusive)
   */
  public nextInt(min: number, max: number, options: RandomNumberOptions = { mode: 'secure' }): number {
    this.validateRange(min, max);

    if (options.mode === 'pseudo') {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    return randomInt(min, max);
  }

  /**
   * Generates a random float between min (inclusive) and max (exclusive)
   */
  public nextFloat(min: number, max: number, options: RandomNumberOptions = { mode: 'secure' }): number {
    this.validateRange(min, max);

    if (options.mode === 'pseudo') {
      return Math.random() * (max - min) + min;
    }

    // Generate a random 32-bit unsigned integer and divide by 2^32 to get a value in [0, 1)
    const buffer = randomBytes(4);
    const randomValue = buffer.readUInt32BE(0) / 0xffffffff;
    
    return randomValue * (max - min) + min;
  }

  public batch<T>(count: number, generator: () => T): T[] {
    if (count < 0) {
      throw new Error('Batch count must be non-negative');
    }
    const result: T[] = new Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = generator();
    }
    return result;
  }

  private validateRange(min: number, max: number): void {
    if (min >= max) {
      throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
    }
  }
}

export const randomNumberGenerator = RandomNumberGenerator.getInstance();
