# Crypto Module Documentation

This module provides a unified interface for cryptographic operations, supporting both symmetric and asymmetric algorithms.

## Supported Algorithms

### Symmetric Encryption
Implemented via `SymmetricCryptoService`.

- **AES (Advanced Encryption Standard)**
  - Modes: GCM (Recommended), CBC, ECB, CTR, CFB, OFB.
  - **Security Note**: GCM is the most secure mode as it provides authenticated encryption. Prefer AES-GCM over others.
  - Implementation: Uses Web Crypto API for GCM (high performance), CryptoJS for others.

- **DES (Data Encryption Standard)**
  - Modes: CBC, ECB, etc.
  - **Security Note**: DES is considered insecure due to short key length (56-bit). Use only for legacy compatibility.

- **3DES (Triple DES)**
  - Modes: CBC, ECB, etc.
  - **Security Note**: Better than DES but slower and less secure than AES. Deprecated by NIST.

- **Blowfish**
  - Modes: CBC, ECB, etc.
  - **Security Note**: Good legacy algorithm but AES is generally preferred. Susceptible to birthday attacks on large data sets (>4GB).

### Asymmetric Encryption
Implemented via `RsaService`.

- **RSA (Rivest–Shamir–Adleman)**
  - Key Sizes: 1024, 2048, 4096.
  - Padding: OAEP (Encryption).
  - **Security Note**: Use at least 2048-bit keys. OAEP padding is mandatory for security.

## Usage Examples

### AES-GCM (Recommended for Data)
```typescript
import { SymmetricCryptoService } from '@/lib/crypto';

const key = 'my-secret-key-16ch'; // Or generate random
const { content, iv, tag } = await SymmetricCryptoService.encrypt('Secret Data', key, {
  algorithm: 'AES',
  mode: 'GCM'
});

const plaintext = await SymmetricCryptoService.decrypt(content, key, {
  algorithm: 'AES',
  mode: 'GCM',
  iv: iv
});
```

### RSA Encryption
```typescript
import { RsaService } from '@/lib/crypto';

// 1. Generate Keys
const { publicKey, privateKey } = await RsaService.generateKeyPair(2048);

// 2. Encrypt
const encrypted = await RsaService.encrypt('Sensitive Data', publicKey);

// 3. Decrypt
const decrypted = await RsaService.decrypt(encrypted, privateKey);
```

## Security Best Practices

1. **Key Management**: Never hardcode keys in source code. Use environment variables or a key management service.
2. **Randomness**: IVs (Initialization Vectors) are automatically generated using secure random number generators. Do not reuse IVs with the same key.
3. **Algorithm Selection**: Default to AES-GCM for symmetric encryption and RSA-OAEP (2048+) for asymmetric encryption. Avoid ECB mode as it leaks patterns.
4. **Encoding**: Be careful with character encodings. The library defaults to UTF-8.
