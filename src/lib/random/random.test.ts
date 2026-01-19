import { randomNumberGenerator } from './number-generator';
import { randomStringGenerator } from './string-generator';

describe('Random Module', () => {
  describe('RandomNumberGenerator', () => {
    it('should generate integers within range', () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const num = randomNumberGenerator.nextInt(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThan(max);
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it('should generate floats within range', () => {
      const min = 1.5;
      const max = 2.5;
      for (let i = 0; i < 100; i++) {
        const num = randomNumberGenerator.nextFloat(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThan(max);
        expect(Number.isInteger(num)).toBe(false); // Likely false
      }
    });

    it('should throw error for invalid range', () => {
      expect(() => randomNumberGenerator.nextInt(10, 10)).toThrow();
      expect(() => randomNumberGenerator.nextInt(10, 5)).toThrow();
    });

    it('should support batch generation', () => {
      const count = 10;
      const result = randomNumberGenerator.batch(count, () => randomNumberGenerator.nextInt(1, 100));
      expect(result).toHaveLength(count);
      result.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThan(100);
      });
    });

    it('should work in pseudo mode', () => {
      const num = randomNumberGenerator.nextInt(1, 10, { mode: 'pseudo' });
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThan(10);

      const float = randomNumberGenerator.nextFloat(1.0, 2.0, { mode: 'pseudo' });
      expect(float).toBeGreaterThanOrEqual(1.0);
      expect(float).toBeLessThan(2.0);
    });

    it('should throw error for invalid batch count', () => {
      expect(() => randomNumberGenerator.batch(-1, () => 1)).toThrow();
    });
  });

  describe('RandomStringGenerator', () => {
    it('should generate string of specified length', () => {
      const length = 16;
      const str = randomStringGenerator.generate(length);
      expect(str).toHaveLength(length);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => randomStringGenerator.generate(-1)).toThrow();
      expect(() => randomStringGenerator.generate(10, { charset: '' })).toThrow();
    });

    it('should work in pseudo mode', () => {
      const str = randomStringGenerator.generate(10, { mode: 'pseudo' });
      expect(str).toHaveLength(10);
    });

    it('should use specified charset', () => {
      const charset = 'ABC';
      const str = randomStringGenerator.generate(50, { charset });
      for (const char of str) {
        expect(charset).toContain(char);
      }
    });

    it('should exclude characters', () => {
      const str = randomStringGenerator.generate(100, { 
        strength: 'weak', // a-z0-9
        exclude: '0123456789' // exclude numbers
      });
      // Should only be a-z
      expect(str).toMatch(/^[a-z]+$/);
    });

    it('should support different strengths', () => {
      const weak = randomStringGenerator.generate(100, { strength: 'weak' });
      expect(weak).toMatch(/^[a-z0-9]+$/);

      const medium = randomStringGenerator.generate(100, { strength: 'medium' });
      expect(medium).toMatch(/^[a-zA-Z0-9]+$/);
      
      // Strong contains special chars, but it's random so strictly it MIGHT not contain them in a short run, 
      // but in 100 chars it likely will. We just check it respects the charset.
      // We can't easily test "it must contain special chars" without retry logic or parsing charset.
    });

    it('should handle multi-language charset', () => {
      const charset = '你好世界';
      const str = randomStringGenerator.generate(10, { charset });
      for (const char of str) {
        expect(charset).toContain(char);
      }
    });
  });

  describe('Performance', () => {
    it('should generate numbers quickly (<5ms)', () => {
      const start = process.hrtime();
      randomNumberGenerator.nextInt(0, 1000);
      const diff = process.hrtime(start);
      const ms = diff[0] * 1000 + diff[1] / 1e6;
      expect(ms).toBeLessThan(5);
    });

    it('should generate strings quickly (<5ms)', () => {
      const start = process.hrtime();
      randomStringGenerator.generate(32);
      const diff = process.hrtime(start);
      const ms = diff[0] * 1000 + diff[1] / 1e6;
      expect(ms).toBeLessThan(5);
    });
  });
});
