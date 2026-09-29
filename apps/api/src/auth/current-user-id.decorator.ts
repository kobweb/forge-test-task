import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { AppError } from '../common/app-error';
import type { AuthenticatedRequest } from './authenticated-request';

/** The id of the signed-in user. Every resource is scoped by it. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const { userId } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!userId) throw new AppError('UNAUTHORIZED', 'Please sign in again.');
    return userId;
  },
);
