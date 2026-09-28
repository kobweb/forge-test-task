import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppError } from './app-error';
import { toErrorResponse } from './http-error.filter';

describe('toErrorResponse', () => {
  it('maps an AppError to the status for its code and keeps its message', () => {
    expect(toErrorResponse(new AppError('SESSION_LOCKED', 'Finish Foundation first.'))).toEqual({
      status: 409,
      body: { code: 'SESSION_LOCKED', message: 'Finish Foundation first.' },
    });
  });

  it.each([
    [new BadRequestException(), 400, 'VALIDATION_FAILED'],
    [new UnauthorizedException(), 401, 'UNAUTHORIZED'],
    [new NotFoundException(), 404, 'NOT_FOUND'],
  ])('maps Nest exception %p to %i %s', (exception, status, code) => {
    expect(toErrorResponse(exception)).toMatchObject({ status, body: { code } });
  });

  it('hides anything unexpected behind a generic 500', () => {
    for (const exception of [new Error('db exploded'), new ForbiddenException(), 'boom']) {
      expect(toErrorResponse(exception)).toEqual({
        status: 500,
        body: { code: 'INTERNAL', message: 'Something went wrong.' },
      });
    }
  });
});
