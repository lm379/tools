import { RsaService } from './rsa';
import { webcrypto } from 'node:crypto';

// Polyfill Web Crypto API
// Check if crypto or subtle is missing, and polyfill with node:crypto
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

describe('RsaService', () => {
  // Increase timeout for key generation
  jest.setTimeout(30000);

  let keyPair: { publicKey: string; privateKey: string };
  const plainText = 'Hello RSA';

  beforeAll(async () => {
    // Generate a smaller key for faster testing
    keyPair = await RsaService.generateKeyPair(1024);
  });

  it('should generate valid PEM keys', () => {
    expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
  });

  it('should encrypt and decrypt using OAEP (default)', async () => {
    const encrypted = await RsaService.encrypt(plainText, keyPair.publicKey);
    expect(encrypted).not.toBe(plainText);
    
    const decrypted = await RsaService.decrypt(encrypted, keyPair.privateKey);
    expect(decrypted).toBe(plainText);
  });

  it('should handle Hex output format', async () => {
    const encrypted = await RsaService.encrypt(plainText, keyPair.publicKey, {
      outputFormat: 'Hex'
    });
    expect(encrypted).toMatch(/^[0-9a-fA-F]+$/);
    
    const decrypted = await RsaService.decrypt(encrypted, keyPair.privateKey, {
      inputFormat: 'Hex'
    });
    expect(decrypted).toBe(plainText);
  });
});
