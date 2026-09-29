import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppError } from '../common/app-error';
import { USERS_REPOSITORY, type UsersRepository } from '../users/users.repository';
import type { AuthenticatedRequest } from './authenticated-request';
import { IS_PUBLIC } from './public.decorator';

// Registered globally (APP_GUARD): every route needs a bearer token unless it is @Public().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request.headers.authorization);
    const payload = token
      ? await this.jwt.verifyAsync<{ sub?: unknown }>(token).catch(() => null)
      : null;
    const userId = typeof payload?.sub === 'string' ? payload.sub : null;
    // A token outlives a deleted account; the user must still exist.
    if (!userId || !(await this.users.findById(userId))) {
      throw new AppError('UNAUTHORIZED', 'Please sign in again.');
    }
    request.userId = userId;
    return true;
  }
}

function bearerToken(header: string | undefined): string | null {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}
