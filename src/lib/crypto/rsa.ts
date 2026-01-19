import {
  RsaEncryptionOptions,
  RsaDecryptionOptions,
  OutputFormat,
  KeyFormat,
  RsaPadding
} from './types';

export class RsaService {
  /**
   * Generates RSA Key Pair
   * Returns keys in PEM format
   */
  static async generateKeyPair(modulusLength: 1024 | 2048 | 4096 = 2048): Promise<{ publicKey: string; privateKey: string }> {
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API is not available');
    }

    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: modulusLength,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKey = await this.exportKey(keyPair.publicKey, 'spki');
    const privateKey = await this.exportKey(keyPair.privateKey, 'pkcs8');

    return { publicKey, privateKey };
  }

  static async encrypt(
    content: string,
    publicKeyPem: string,
    options: RsaEncryptionOptions = {}
  ): Promise<string> {
    const { padding = 'OAEP', outputFormat = 'Base64' } = options;
    const crypto = globalThis.crypto;

    const key = await this.importKey(publicKeyPem, 'spki');
    const data = new TextEncoder().encode(content);

    let encrypted: ArrayBuffer;
    if (padding === 'OAEP') {
      encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        key,
        data as unknown as BufferSource
      );
    } else {
      // Web Crypto RSA-OAEP doesn't support PKCS1_v1_5 directly usually, usually only RSA-OAEP
      // RSA-PSS is for signing.
      // If user wants PKCS1_v1_5 encryption, Web Crypto might not support it standardly in all browsers.
      // But let's check. 'RSA-OAEP' is the standard for encryption.
      // If requested PKCS1, we might throw or try generic 'RSA-OAEP'.
      // Actually, standard Web Crypto only does OAEP for encrypt/decrypt.
      throw new Error('Web Crypto API only supports OAEP padding for RSA encryption');
    }

    const buffer = new Uint8Array(encrypted);
    if (outputFormat === 'Hex') {
      return this.uint8ToHex(buffer);
    }
    return this.uint8ToBase64(buffer);
  }

  static async decrypt(
    content: string,
    privateKeyPem: string,
    options: RsaDecryptionOptions = {}
  ): Promise<string> {
    const { padding = 'OAEP', inputFormat = 'Base64', outputEncoding = 'UTF-8' } = options;
    const crypto = globalThis.crypto;

    const key = await this.importKey(privateKeyPem, 'pkcs8');

    let data: Uint8Array;
    if (inputFormat === 'Hex') {
      data = this.hexToUint8(content);
    } else {
      data = this.base64ToUint8(content);
    }

    let decrypted: ArrayBuffer;
    if (padding === 'OAEP') {
      decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        key,
        data as unknown as BufferSource
      );
    } else {
      throw new Error('Web Crypto API only supports OAEP padding for RSA decryption');
    }

    const buffer = new Uint8Array(decrypted);
    const decoder = new TextDecoder(outputEncoding === 'GBK' ? 'gbk' : 'utf-8');
    return decoder.decode(buffer);
  }

  // --- Helpers ---

  private static async importKey(pem: string, type: 'spki' | 'pkcs8'): Promise<CryptoKey> {
    const crypto = globalThis.crypto;
    const binaryDer = this.pemToDer(pem);

    return crypto.subtle.importKey(
      type,
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      type === 'spki' ? ['encrypt'] : ['decrypt']
    );
  }

  private static async exportKey(key: CryptoKey, type: 'spki' | 'pkcs8'): Promise<string> {
    const crypto = globalThis.crypto;
    const exported = await crypto.subtle.exportKey(type, key);
    return this.derToPem(exported, type === 'spki' ? 'PUBLIC' : 'PRIVATE');
  }

  private static pemToDer(pem: string): ArrayBuffer {
    // Remove header, footer, newlines
    const b64 = pem
      .replace(/-----BEGIN (.*)-----/, '')
      .replace(/-----END (.*)-----/, '')
      .replace(/\s/g, '');

    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private static derToPem(der: ArrayBuffer, type: 'PUBLIC' | 'PRIVATE'): string {
    const bytes = new Uint8Array(der);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    // Wrap at 64 chars
    const chunks = b64.match(/.{1,64}/g) || [];
    const body = chunks.join('\n');

    return `-----BEGIN ${type} KEY-----\n${body}\n-----END ${type} KEY-----`;
  }

  private static hexToUint8(hexString: string): Uint8Array {
    const cleanHex = hexString.replace(/\s|0x/g, '');
    const arrayBuffer = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      arrayBuffer[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
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
