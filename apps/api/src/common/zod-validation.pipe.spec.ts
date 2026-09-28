import { signupBodySchema } from '@forge/contracts';
import { ZodValidationPipe } from './zod-validation.pipe';

function thrownBy(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the action to throw');
}

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(signupBodySchema);

  it('returns the parsed, normalised value', () => {
    expect(pipe.transform({ email: ' Alex@Example.com ', password: 'correct horse' })).toEqual({
      email: 'alex@example.com',
      password: 'correct horse',
    });
  });

  it('throws VALIDATION_FAILED carrying the first issue message as user-facing copy', () => {
    expect(
      thrownBy(() => pipe.transform({ email: 'nope', password: 'correct horse' })),
    ).toMatchObject({ code: 'VALIDATION_FAILED', message: 'Enter a valid email address.' });
  });
});
