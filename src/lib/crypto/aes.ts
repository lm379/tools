import { SymmetricCryptoService } from './symmetric';
import { AesResult, EncryptionOptions, DecryptionOptions } from './types';

/**
 * Legacy AES Service wrapper.
 * Recommended: Use SymmetricCryptoService directly.
 */
export class AesService {
  static async encrypt(content: string, key: string, options: EncryptionOptions): Promise<AesResult> {
    return SymmetricCryptoService.encrypt(content, key, { ...options, algorithm: 'AES' });
  }

  static async decrypt(content: string, key: string, options: DecryptionOptions): Promise<string> {
    return SymmetricCryptoService.decrypt(content, key, { ...options, algorithm: 'AES' });
  }
}
