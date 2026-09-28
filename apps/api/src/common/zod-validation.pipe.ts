import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { AppError } from './app-error';

// Validates and normalises input with a @forge/contracts schema. The first issue's message
// is user-facing copy, so it goes straight into the 400 body.
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform<
  unknown,
  z.output<TSchema>
> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_FAILED',
        result.error.issues[0]?.message ?? 'Invalid request.',
      );
    }
    return result.data;
  }
}
