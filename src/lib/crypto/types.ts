export type SymmetricAlgorithm = 'AES' | 'DES' | '3DES' | 'Blowfish';
export type AsymmetricAlgorithm = 'RSA';

export type SymmetricMode = 'CBC' | 'ECB' | 'CTR' | 'CFB' | 'OFB' | 'GCM';
export type SymmetricPadding = 'Pkcs7' | 'Pkcs5' | 'Iso10126' | 'ZeroPadding' | 'NoPadding';

export type RsaPadding = 'OAEP' | 'PKCS1_v1_5';

export type KeyFormat = 'text' | 'hex' | 'base64';
export type OutputFormat = 'Base64' | 'Hex';
export type CharacterEncoding = 'UTF-8' | 'ASCII' | 'GBK';

// Deprecated alias for backward compatibility
export type AesMode = SymmetricMode;
export type AesPadding = SymmetricPadding;

export interface EncryptionOptions {
  algorithm?: SymmetricAlgorithm; // Defaults to AES
  mode: SymmetricMode;
  padding?: SymmetricPadding;
  iv?: string; // Hex or Base64 string
  ivFormat?: 'hex' | 'base64'; // Defaults to hex
  keyFormat?: KeyFormat;
  inputEncoding?: CharacterEncoding;
  outputFormat?: OutputFormat;
}

export interface DecryptionOptions {
  algorithm?: SymmetricAlgorithm; // Defaults to AES
  mode: SymmetricMode;
  padding?: SymmetricPadding;
  iv?: string;
  ivFormat?: 'hex' | 'base64'; // Defaults to hex
  keyFormat?: KeyFormat;
  outputEncoding?: CharacterEncoding;
  inputFormat?: OutputFormat;
}

export interface AesResult {
  content: string;
  iv?: string; // Returned if generated
  tag?: string; // For GCM
}

export interface RsaEncryptionOptions {
  padding?: RsaPadding;
  outputFormat?: OutputFormat;
}

export interface RsaDecryptionOptions {
  padding?: RsaPadding;
  inputFormat?: OutputFormat;
  outputEncoding?: CharacterEncoding;
}
