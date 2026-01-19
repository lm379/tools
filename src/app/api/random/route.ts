import { NextResponse } from 'next/server';
import { randomNumberGenerator, randomStringGenerator } from '@/lib/random';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, count = 1, ...params } = body;

    if (count < 1 || count > 1000) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 1000' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'number') {
      const { min, max, options } = params;
      if (typeof min !== 'number' || typeof max !== 'number') {
        return NextResponse.json({ error: 'Min and Max must be numbers' }, { status: 400 });
      }

      if (options?.float) {
        if (count > 1) {
          result = randomNumberGenerator.batch(count, () =>
            randomNumberGenerator.nextFloat(min, max, options)
          );
        } else {
          result = randomNumberGenerator.nextFloat(min, max, options);
        }
      } else {
        if (count > 1) {
          result = randomNumberGenerator.batch(count, () =>
            randomNumberGenerator.nextInt(min, max, options)
          );
        } else {
          result = randomNumberGenerator.nextInt(min, max, options);
        }
      }
    } else if (type === 'string') {
      const { length, options } = params;
      if (typeof length !== 'number') {
        return NextResponse.json({ error: 'Length must be a number' }, { status: 400 });
      }

      if (count > 1) {
        // String generator doesn't have a built-in batch, but we can map
        result = Array.from({ length: count }, () =>
          randomStringGenerator.generate(length, options)
        );
      } else {
        result = randomStringGenerator.generate(length, options);
      }
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Random generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
