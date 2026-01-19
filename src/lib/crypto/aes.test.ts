import { AesService } from './aes';
import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto API for Node.js environment
// JSDOM might provide a partial crypto implementation without subtle
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  // We need to cast because the types might conflict slightly
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

describe('AesService', () => {
  const plainText = 'Hello World';
  const secretKey = '1234567890123456'; // 16 bytes for AES-128
  const hexKey = '31323334353637383930313233343536'; // Hex of "1234567890123456"
  const base64Key = Buffer.from(secretKey).toString('base64');

  describe('CBC Mode', () => {
    it('should encrypt and decrypt correctly with default options', async () => {
      const encrypted = await AesService.encrypt(plainText, secretKey, {
        mode: 'CBC',
        keyFormat: 'text',
      });
      expect(encrypted.content).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await AesService.decrypt(encrypted.content, secretKey, {
        mode: 'CBC',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });

    it('should handle Hex keys correctly', async () => {
      const encrypted = await AesService.encrypt(plainText, hexKey, {
        mode: 'CBC',
        keyFormat: 'hex',
      });
      expect(encrypted.content).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      
      const decrypted = await AesService.decrypt(encrypted.content, hexKey, {
        mode: 'CBC',
        iv: encrypted.iv,
        keyFormat: 'hex',
      });
      expect(decrypted).toBe(plainText);
    });

    it('should handle Base64 keys correctly', async () => {
      const encrypted = await AesService.encrypt(plainText, base64Key, {
        mode: 'CBC',
        keyFormat: 'base64',
      });
      
      const decrypted = await AesService.decrypt(encrypted.content, base64Key, {
        mode: 'CBC',
        iv: encrypted.iv,
        keyFormat: 'base64',
      });
      expect(decrypted).toBe(plainText);
    });
  });

  describe('ECB Mode', () => {
    it('should encrypt and decrypt without IV', async () => {
      const encrypted = await AesService.encrypt(plainText, secretKey, {
        mode: 'ECB',
        keyFormat: 'text',
      });
      expect(encrypted.iv).toBeUndefined();

      const decrypted = await AesService.decrypt(encrypted.content, secretKey, {
        mode: 'ECB',
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });
  });

  describe('GCM Mode', () => {
    it('should encrypt and decrypt with generated IV', async () => {
      const encrypted = await AesService.encrypt(plainText, secretKey, {
        mode: 'GCM',
        keyFormat: 'text',
      });
      expect(encrypted.content).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await AesService.decrypt(encrypted.content, secretKey, {
        mode: 'GCM',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });

    it('should handle Hex IV correctly', async () => {
      const iv = '000000000000000000000000'; // 12 bytes hex
      const encrypted = await AesService.encrypt(plainText, secretKey, {
        mode: 'GCM',
        keyFormat: 'text',
        iv,
        ivFormat: 'hex',
      });

      expect(encrypted.iv).toBe(iv);

      const decrypted = await AesService.decrypt(encrypted.content, secretKey, {
        mode: 'GCM',
        iv,
        ivFormat: 'hex',
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });

    it('should handle Base64 IV correctly', async () => {
      const ivHex = '000000000000000000000000';
      const ivBase64 = Buffer.from(ivHex, 'hex').toString('base64');

      const encrypted = await AesService.encrypt(plainText, secretKey, {
        mode: 'GCM',
        keyFormat: 'text',
        iv: ivBase64,
        ivFormat: 'base64',
      });

      const decrypted = await AesService.decrypt(encrypted.content, secretKey, {
        mode: 'GCM',
        iv: ivBase64,
        ivFormat: 'base64',
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });
  });

  describe('Output Formats', () => {
    it('should output Hex format', async () => {
      const encrypted = await AesService.encrypt(plainText, secretKey, {
        mode: 'ECB',
        keyFormat: 'text',
        outputFormat: 'Hex',
      });
      expect(encrypted.content).toMatch(/^[0-9a-fA-F]+$/);

      const decrypted = await AesService.decrypt(encrypted.content, secretKey, {
        mode: 'ECB',
        keyFormat: 'text',
        inputFormat: 'Hex',
      });
      expect(decrypted).toBe(plainText);
    });
  });
});
