import { z } from 'zod';
import { userSchema } from './me';

// bcrypt only looks at the first 72 bytes of a password.
const MAX_PASSWORD_BYTES = 72;

function utf8Length(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export const emailSchema = z
  .string('Enter a valid email address.')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254, 'Enter a valid email address.'));

export const newPasswordSchema = z
  .string('Use at least 8 characters.')
  .min(8, 'Use at least 8 characters.')
  .refine((value) => utf8Length(value) <= MAX_PASSWORD_BYTES, 'Use 72 characters or fewer.');

export const signupBodySchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});
export type SignupBody = z.infer<typeof signupBodySchema>;

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string('Enter your password.').min(1, 'Enter your password.'),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const authResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
