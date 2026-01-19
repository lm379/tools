# Random Generation Module

A comprehensive, thread-safe, and cryptographically secure random generation module for Node.js applications.

## Features

- **Random Character Generator**:
  - Customizable length and charset
  - Pre-defined strength levels (weak, medium, strong)
  - Exclusion of specific characters
  - Support for multi-language characters
- **Random Number Generator**:
  - Integer and Float generation
  - Cryptographically secure by default (using Node.js `crypto`)
  - Pseudo-random mode option (using `Math.random`)
  - Batch generation support
- **High Performance**: Optimized for speed (<5ms per operation)
- **Type Safe**: Written in TypeScript with full type definitions

## Usage

Import the generators from the module:

```typescript
import { randomNumberGenerator, randomStringGenerator } from '@/lib/random';
```

### Random Number Generation

#### Integers

Generate a random integer between `min` (inclusive) and `max` (exclusive):

```typescript
// Secure random integer (default)
const int = randomNumberGenerator.nextInt(1, 100); // e.g., 42

// Pseudo-random integer (faster, non-secure)
const pseudoInt = randomNumberGenerator.nextInt(1, 100, { mode: 'pseudo' });
```

#### Floats

Generate a random floating-point number between `min` (inclusive) and `max` (exclusive):

```typescript
const float = randomNumberGenerator.nextFloat(0.0, 1.0); // e.g., 0.732...
```

#### Batch Generation

Generate multiple values at once:

```typescript
const numbers = randomNumberGenerator.batch(5, () => randomNumberGenerator.nextInt(1, 10));
// [3, 7, 1, 9, 2]
```

### Random String Generation

#### Basic Usage

```typescript
const str = randomStringGenerator.generate(16);
// e.g., "aB3dE9..." (default strength: medium)
```

#### Strength Levels

- **Weak**: Lowercase letters + Numbers
- **Medium** (Default): Uppercase + Lowercase + Numbers
- **Strong**: Uppercase + Lowercase + Numbers + Special Characters

```typescript
const weak = randomStringGenerator.generate(10, { strength: 'weak' });
const strong = randomStringGenerator.generate(32, { strength: 'strong' });
```

#### Custom Charset

```typescript
const pin = randomStringGenerator.generate(6, { charset: '0123456789' });
const multiLang = randomStringGenerator.generate(4, { charset: '你好世界' });
```

#### Excluding Characters

Useful for generating readable codes (e.g., avoiding 'O' and '0', 'I' and 'l'):

```typescript
const code = randomStringGenerator.generate(8, {
  strength: 'medium',
  exclude: 'O0Il'
});
```

## API Reference

### `RandomNumberGenerator`

- `nextInt(min: number, max: number, options?: RandomNumberOptions): number`
- `nextFloat(min: number, max: number, options?: RandomNumberOptions): number`
- `batch<T>(count: number, generator: () => T): T[]`

### `RandomStringGenerator`

- `generate(length: number, options?: RandomStringOptions): string`

### Types

```typescript
type RandomMode = 'secure' | 'pseudo';

interface RandomNumberOptions {
  mode?: RandomMode;
}

interface RandomStringOptions {
  length?: number;
  charset?: string;
  exclude?: string;
  strength?: 'weak' | 'medium' | 'strong';
  mode?: RandomMode;
}
```

## Performance

Unit tests verify that single generation operations typically complete in < 1ms on standard hardware.

## Security

By default, the module uses Node.js `crypto.randomInt` and `crypto.randomBytes` which are cryptographically secure suitable for session IDs, tokens, etc.
For non-security critical applications requiring higher performance, use `{ mode: 'pseudo' }`.
