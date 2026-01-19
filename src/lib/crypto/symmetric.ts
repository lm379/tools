import CryptoJS from 'crypto-js';
import { 
  SymmetricAlgorithm, 
  SymmetricMode, 
  SymmetricPadding, 
  AesResult, 
  DecryptionOptions, 
  EncryptionOptions, 
  KeyFormat, 
  OutputFormat, 
  CharacterEncoding 
} from './types';

/**
 * Symmetric Encryption Service
 * 
 * Supports AES, DES, 3DES, Blowfish.
 * Modes: CBC, ECB, CTR, CFB, OFB, GCM (AES only).
 */
export class SymmetricCryptoService {
  /**
   * Generates a random key for the specified algorithm
   * @param algorithm - The algorithm to generate a key for
   * @returns Hex string of the key
   */
  static generateKey(algorithm: SymmetricAlgorithm = 'AES'): string {
    let byteLength = 32; // Default AES-256 / Blowfish
    
    switch (algorithm) {
      case 'AES': byteLength = 32; break;
      case 'DES': byteLength = 8; break;
      case '3DES': byteLength = 24; break;
      case 'Blowfish': byteLength = 32; break; // Max 56 bytes, usually 32 is fine
    }

    const randomWords = CryptoJS.lib.WordArray.random(byteLength);
    return randomWords.toString(CryptoJS.enc.Hex);
  }

  /**
   * Encrypts content using specified algorithm
   */
  static async encrypt(
    content: string,
    key: string,
    options: EncryptionOptions
  ): Promise<AesResult> {
    const {
      algorithm = 'AES',
      mode,
      padding = 'Pkcs7',
      iv,
      ivFormat = 'hex',
      keyFormat = 'text',
      outputFormat = 'Base64',
    } = options;

    // Handle GCM separately using Web Crypto API (AES Only)
    if (mode === 'GCM') {
      if (algorithm !== 'AES') {
        throw new Error('GCM mode is currently only supported for AES');
      }
      return this.encryptGCM(content, key, iv, ivFormat, keyFormat, outputFormat);
    }

    // Prepare Key
    const parsedKey = this.parseKey(key, keyFormat);
    
    // Prepare IV
    let parsedIv: CryptoJS.lib.WordArray | undefined;
    const blockSize = this.getBlockSize(algorithm);
    
    if (iv) {
      parsedIv = this.parseIv(iv, ivFormat);
    } else if (mode !== 'ECB') {
      // Generate random IV for non-ECB modes if not provided
      // Block size is in words (4 bytes). AES=4 (128bit), DES/3DES/Blowfish=2 (64bit)
      parsedIv = CryptoJS.lib.WordArray.random(blockSize * 4);
    }

    // Configure Options
    const cryptoOptions: any = {
      mode: this.getMode(mode),
      padding: this.getPadding(padding),
    };

    if (parsedIv) {
      cryptoOptions.iv = parsedIv;
    }

    // Select Algorithm
    const cipher = this.getCipher(algorithm);

    // Encrypt
    const encrypted = cipher.encrypt(content, parsedKey, cryptoOptions);

    // Format Output
    let outputStr = '';
    if (outputFormat === 'Hex') {
      outputStr = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    } else {
      // Default to Base64
      outputStr = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    }

    return {
      content: outputStr,
      iv: parsedIv ? parsedIv.toString(CryptoJS.enc.Hex) : undefined,
    };
  }

  /**
   * Decrypts content
   */
  static async decrypt(
    content: string,
    key: string,
    options: DecryptionOptions
  ): Promise<string> {
    const {
      algorithm = 'AES',
      mode,
      padding = 'Pkcs7',
      iv,
      ivFormat = 'hex',
      keyFormat = 'text',
      inputFormat = 'Base64',
      outputEncoding = 'UTF-8',
    } = options;

    if (mode === 'GCM') {
      if (algorithm !== 'AES') {
        throw new Error('GCM mode is currently only supported for AES');
      }
      return this.decryptGCM(content, key, iv, ivFormat, keyFormat, inputFormat, outputEncoding);
    }

    const parsedKey = this.parseKey(key, keyFormat);
    let parsedIv: CryptoJS.lib.WordArray | undefined;
    if (iv) {
      parsedIv = this.parseIv(iv, ivFormat);
    }

    const cryptoOptions: any = {
      mode: this.getMode(mode),
      padding: this.getPadding(padding),
    };

    if (parsedIv) {
      cryptoOptions.iv = parsedIv;
    }

    // Prepare CipherParams or WordArray
    let ciphertext: CryptoJS.lib.WordArray;
    if (inputFormat === 'Hex') {
      ciphertext = CryptoJS.enc.Hex.parse(content);
    } else {
      ciphertext = CryptoJS.enc.Base64.parse(content);
    }

    // Select Algorithm
    const cipher = this.getCipher(algorithm);

    // Decrypt
    const decrypted = cipher.decrypt(
      { ciphertext: ciphertext } as any,
      parsedKey,
      cryptoOptions
    );

    // Convert output
    try {
      if (outputEncoding === 'ASCII') {
        return decrypted.toString(CryptoJS.enc.Latin1);
      }
      if (outputEncoding === 'GBK') {
        // Convert WordArray to Uint8Array for TextDecoder
        const words = decrypted.words;
        const sigBytes = decrypted.sigBytes;
        const u8 = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; i++) {
          u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        const decoder = new TextDecoder('gbk');
        return decoder.decode(u8);
      }
      // Default to UTF-8
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      throw new Error('Decryption failed or invalid encoding');
    }
  }

  // --- GCM Implementation (Web Crypto API) ---

  private static async encryptGCM(
    content: string,
    key: string,
    ivStr: string | undefined,
    ivFormat: 'hex' | 'base64',
    keyFormat: KeyFormat,
    outputFormat: OutputFormat
  ): Promise<AesResult> {
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not available in this environment');
    }

    // 1. Prepare Key
    const keyBytes = this.getKeyBytes(key, keyFormat);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // 2. Prepare IV
    let iv: Uint8Array;
    if (ivStr) {
      iv = this.getIvBytes(ivStr, ivFormat);
    } else {
      iv = crypto.getRandomValues(new Uint8Array(12));
    }

    // 3. Prepare Data
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    // 4. Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      cryptoKey,
      data as unknown as BufferSource
    );

    // 5. Format Output
    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    let outputStr = '';
    if (outputFormat === 'Hex') {
      outputStr = this.uint8ToHex(encryptedArray);
    } else {
      outputStr = this.uint8ToBase64(encryptedArray);
    }

    return {
      content: outputStr,
      iv: this.uint8ToHex(iv), 
    };
  }

  private static async decryptGCM(
    content: string,
    key: string,
    ivStr: string | undefined,
    ivFormat: 'hex' | 'base64',
    keyFormat: KeyFormat,
    inputFormat: OutputFormat,
    outputEncoding: CharacterEncoding | undefined
  ): Promise<string> {
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not available in this environment');
    }

    if (!ivStr) throw new Error('IV is required for GCM decryption');

    const keyBytes = this.getKeyBytes(key, keyFormat);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = this.getIvBytes(ivStr, ivFormat);

    let data: Uint8Array;
    if (inputFormat === 'Hex') {
      data = this.hexToUint8(content);
    } else {
      data = this.base64ToUint8(content);
    }

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as unknown as BufferSource,
        },
        cryptoKey,
        data as unknown as BufferSource
      );

      let decoder: TextDecoder;
      if (outputEncoding === 'GBK') {
        decoder = new TextDecoder('gbk');
      } else if (outputEncoding === 'ASCII') {
        decoder = new TextDecoder('ascii');
      } else {
        decoder = new TextDecoder();
      }

      return decoder.decode(decryptedBuffer);
    } catch (e) {
      throw new Error('GCM Decryption failed (Auth tag mismatch or invalid key)');
    }
  }

  // --- Helpers ---

  private static getCipher(algorithm: SymmetricAlgorithm): any {
    switch (algorithm) {
      case 'AES': return CryptoJS.AES;
      case 'DES': return CryptoJS.DES;
      case '3DES': return CryptoJS.TripleDES;
      case 'Blowfish': return CryptoJS.Blowfish;
      default: return CryptoJS.AES;
    }
  }

  private static getBlockSize(algorithm: SymmetricAlgorithm): number {
    // Return block size in 32-bit words
    switch (algorithm) {
      case 'AES': return 4; // 128 bit
      case 'DES': 
      case '3DES': 
      case 'Blowfish': return 2; // 64 bit
      default: return 4;
    }
  }

  private static parseKey(key: string, format: KeyFormat): CryptoJS.lib.WordArray {
    if (format === 'hex') {
      return CryptoJS.enc.Hex.parse(key);
    }
    if (format === 'base64') {
      return CryptoJS.enc.Base64.parse(key);
    }
    return CryptoJS.enc.Utf8.parse(key);
  }

  private static parseIv(iv: string, format: 'hex' | 'base64'): CryptoJS.lib.WordArray {
    if (format === 'base64') {
      return CryptoJS.enc.Base64.parse(iv);
    }
    return CryptoJS.enc.Hex.parse(iv);
  }

  private static getKeyBytes(key: string, format: KeyFormat): Uint8Array {
    if (format === 'hex') {
      return this.hexToUint8(key);
    }
    if (format === 'base64') {
      return this.base64ToUint8(key);
    }
    return new TextEncoder().encode(key);
  }

  private static getIvBytes(iv: string, format: 'hex' | 'base64'): Uint8Array {
    if (format === 'base64') {
      return this.base64ToUint8(iv);
    }
    return this.hexToUint8(iv);
  }

  private static getMode(mode: SymmetricMode): any {
    switch (mode) {
      case 'CBC': return CryptoJS.mode.CBC;
      case 'ECB': return CryptoJS.mode.ECB;
      case 'CTR': return CryptoJS.mode.CTR;
      case 'CFB': return CryptoJS.mode.CFB;
      case 'OFB': return CryptoJS.mode.OFB;
      default: return CryptoJS.mode.CBC;
    }
  }

  private static getPadding(padding: SymmetricPadding): any {
    switch (padding) {
      case 'Pkcs7': return CryptoJS.pad.Pkcs7;
      case 'Pkcs5': return CryptoJS.pad.Pkcs7; // Pkcs5 is essentially Pkcs7 for AES
      case 'Iso10126': return CryptoJS.pad.Iso10126;
      case 'ZeroPadding': return CryptoJS.pad.ZeroPadding;
      case 'NoPadding': return CryptoJS.pad.NoPadding;
      default: return CryptoJS.pad.Pkcs7;
    }
  }

  // Uint8Array <-> Hex/Base64 Converters
  private static hexToUint8(hexString: string): Uint8Array {
    const cleanHex = hexString.replace(/\s|0x/g, '');
    if (cleanHex.length % 2 !== 0) throw new Error('Invalid hex string');
    const arrayBuffer = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byteValue = parseInt(cleanHex.substr(i, 2), 16);
      arrayBuffer[i / 2] = byteValue;
    }
    return arrayBuffer;
  }

  private static uint8ToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static base64ToUint8(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private static uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
