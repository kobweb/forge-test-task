import type { ApiError, ErrorCode } from '@forge/contracts';
import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { AppError } from './app-error';

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  PLUS_REQUIRED: 403,
  NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  SESSION_LOCKED: 409,
  INTERNAL: 500,
};

export interface ErrorResponse {
  status: number;
  body: ApiError;
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    return {
      status: STATUS_BY_CODE[exception.code],
      body: { code: exception.code, message: exception.message },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 400) {
      return {
        status,
        body: { code: 'VALIDATION_FAILED', message: 'The request could not be read.' },
      };
    }
    if (status === 401) {
      return { status, body: { code: 'UNAUTHORIZED', message: 'Please sign in again.' } };
    }
    if (status === 404) {
      return { status, body: { code: 'NOT_FOUND', message: 'Not found.' } };
    }
  }
  return { status: 500, body: { code: 'INTERNAL', message: 'Something went wrong.' } };
}

interface JsonResponse {
  status(code: number): { json(body: unknown): unknown };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : exception,
      );
    }
    host.switchToHttp().getResponse<JsonResponse>().status(status).json(body);
  }
}
