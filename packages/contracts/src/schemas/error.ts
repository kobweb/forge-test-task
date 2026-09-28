import { z } from 'zod';
import { ERROR_CODES, type ApiError } from '../domain';

export const apiErrorSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
}) satisfies z.ZodType<ApiError>;
