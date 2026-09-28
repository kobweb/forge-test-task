import type { ErrorCode } from '@forge/contracts';

// Thrown by domain services. HttpErrorFilter turns it into `{ code, message }` with the
// status from STATUS_BY_CODE, so services never deal with HTTP.
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
