import { SymmetricCryptoService } from './symmetric';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

describe('SymmetricCryptoService', () => {
  const plainText = 'Hello World';
  const secretKey = '12345678'; // 8 bytes for DES/Blowfish
  const aesKey = '1234567890123456'; // 16 bytes for AES

  describe('Key Generation', () => {
    it('should generate correct key lengths', () => {
      const aesKey = SymmetricCryptoService.generateKey('AES');
      expect(aesKey.length).toBe(64); // 32 bytes * 2 hex chars

      const desKey = SymmetricCryptoService.generateKey('DES');
      expect(desKey.length).toBe(16); // 8 bytes * 2 hex chars

      const tripleDesKey = SymmetricCryptoService.generateKey('3DES');
      expect(tripleDesKey.length).toBe(48); // 24 bytes * 2 hex chars
    });
  });

  describe('DES', () => {
    it('should encrypt and decrypt using DES-CBC', async () => {
      const encrypted = await SymmetricCryptoService.encrypt(plainText, secretKey, {
        algorithm: 'DES',
        mode: 'CBC',
        keyFormat: 'text',
      });
      expect(encrypted.content).toBeDefined();

      const decrypted = await SymmetricCryptoService.decrypt(encrypted.content, secretKey, {
        algorithm: 'DES',
        mode: 'CBC',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });
  });

  describe('3DES', () => {
    it('should encrypt and decrypt using 3DES-CBC', async () => {
      // 3DES key usually 24 bytes, but crypto-js might pad or handle 8/16. Let's use 24.
      const tripleDesKey = '123456789012345678901234';
      const encrypted = await SymmetricCryptoService.encrypt(plainText, tripleDesKey, {
        algorithm: '3DES',
        mode: 'CBC',
        keyFormat: 'text',
      });
      
      const decrypted = await SymmetricCryptoService.decrypt(encrypted.content, tripleDesKey, {
        algorithm: '3DES',
        mode: 'CBC',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });
  });

  describe('Blowfish', () => {
    it('should encrypt and decrypt using Blowfish-CBC', async () => {
      // Blowfish variable key length, 8 bytes is fine.
      const encrypted = await SymmetricCryptoService.encrypt(plainText, secretKey, {
        algorithm: 'Blowfish',
        mode: 'CBC',
        keyFormat: 'text',
      });
      
      const decrypted = await SymmetricCryptoService.decrypt(encrypted.content, secretKey, {
        algorithm: 'Blowfish',
        mode: 'CBC',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });
  });

  describe('AES New Modes', () => {
    it('should encrypt and decrypt using AES-CFB', async () => {
      const encrypted = await SymmetricCryptoService.encrypt(plainText, aesKey, {
        algorithm: 'AES',
        mode: 'CFB',
        keyFormat: 'text',
      });
      
      const decrypted = await SymmetricCryptoService.decrypt(encrypted.content, aesKey, {
        algorithm: 'AES',
        mode: 'CFB',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });

    it('should encrypt and decrypt using AES-OFB', async () => {
      const encrypted = await SymmetricCryptoService.encrypt(plainText, aesKey, {
        algorithm: 'AES',
        mode: 'OFB',
        keyFormat: 'text',
      });
      
      const decrypted = await SymmetricCryptoService.decrypt(encrypted.content, aesKey, {
        algorithm: 'AES',
        mode: 'OFB',
        iv: encrypted.iv,
        keyFormat: 'text',
      });
      expect(decrypted).toBe(plainText);
    });
  });
});
