import { SymmetricCryptoService } from './symmetric';
import { RsaService } from './rsa';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

describe('Crypto Benchmarks', () => {
  // Increase timeout for benchmarks
  jest.setTimeout(60000);

  const payloadSmall = 'A'.repeat(1024); // 1KB
  const payloadLarge = 'A'.repeat(1024 * 1024); // 1MB
  const iterations = 100;

  const runBenchmark = async (name: string, fn: () => Promise<void>) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = performance.now();
    const avg = (end - start) / iterations;
    console.log(`[Benchmark] ${name}: Total ${(end - start).toFixed(2)}ms, Avg ${avg.toFixed(2)}ms/op`);
  };

  test('Symmetric Encryption Benchmarks', async () => {
    console.log('\n--- Symmetric Encryption Benchmarks (1KB payload, 100 iterations) ---');
    
    await runBenchmark('AES-GCM (WebCrypto)', async () => {
      await SymmetricCryptoService.encrypt(payloadSmall, '1234567890123456', { mode: 'GCM', algorithm: 'AES' });
    });

    await runBenchmark('AES-CBC (CryptoJS)', async () => {
      await SymmetricCryptoService.encrypt(payloadSmall, '1234567890123456', { mode: 'CBC', algorithm: 'AES' });
    });

    await runBenchmark('DES-CBC (CryptoJS)', async () => {
      await SymmetricCryptoService.encrypt(payloadSmall, '12345678', { mode: 'CBC', algorithm: 'DES' });
    });

    await runBenchmark('3DES-CBC (CryptoJS)', async () => {
      await SymmetricCryptoService.encrypt(payloadSmall, '123456789012345678901234', { mode: 'CBC', algorithm: '3DES' });
    });

    await runBenchmark('Blowfish-CBC (CryptoJS)', async () => {
      await SymmetricCryptoService.encrypt(payloadSmall, '12345678', { mode: 'CBC', algorithm: 'Blowfish' });
    });
  });

  test('RSA Benchmarks', async () => {
    console.log('\n--- RSA Benchmarks (Key Gen only, 5 iterations) ---');
    const rsaIterations = 5;
    
    const start = performance.now();
    for (let i = 0; i < rsaIterations; i++) {
      await RsaService.generateKeyPair(2048);
    }
    const end = performance.now();
    console.log(`[Benchmark] RSA-2048 KeyGen: Avg ${(end - start) / rsaIterations}ms/op`);
  });
});
