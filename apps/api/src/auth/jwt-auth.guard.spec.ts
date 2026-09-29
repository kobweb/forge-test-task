import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InMemoryUsersRepository } from '../../test/in-memory/in-memory-users.repository';
import type { AuthenticatedRequest } from './authenticated-request';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

class RoutesStub {
  @Public()
  publicRoute(this: void): void {}

  privateRoute(this: void): void {}
}

function contextFor(route: 'publicRoute' | 'privateRoute', authorization?: string) {
  const request: AuthenticatedRequest = { headers: { authorization } };
  const context = {
    getHandler: () => RoutesStub.prototype[route],
    getClass: () => RoutesStub,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'unit-test-secret-at-least-32-chars!' });
  let users: InMemoryUsersRepository;
  let guard: JwtAuthGuard;
  let userId: string;

  beforeEach(async () => {
    users = new InMemoryUsersRepository();
    guard = new JwtAuthGuard(new Reflector(), jwt, users);
    userId = (await users.create({ email: 'alex@forge.test', passwordHash: 'hash' })).id;
  });

  it('lets @Public() routes through without a token', async () => {
    await expect(guard.canActivate(contextFor('publicRoute').context)).resolves.toBe(true);
  });

  it('accepts a valid bearer token and exposes the user id to the handler', async () => {
    const token = await jwt.signAsync({ sub: userId });
    const { context, request } = contextFor('privateRoute', `Bearer ${token}`);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.userId).toBe(userId);
  });

  it.each([
    ['no header', undefined],
    ['a non-bearer header', 'Basic abc'],
    ['a garbage token', 'Bearer not-a-jwt'],
  ])('rejects %s as UNAUTHORIZED', async (_case, authorization) => {
    await expect(
      guard.canActivate(contextFor('privateRoute', authorization).context),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a valid token sent under a non-bearer scheme', async () => {
    const token = await jwt.signAsync({ sub: userId });
    await expect(
      guard.canActivate(contextFor('privateRoute', `Basic ${token}`).context),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a token signed with another secret', async () => {
    const otherJwt = new JwtService({ secret: 'another-secret-at-least-32-chars!!' });
    const forged = await otherJwt.signAsync({ sub: userId });
    await expect(
      guard.canActivate(contextFor('privateRoute', `Bearer ${forged}`).context),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects an expired token', async () => {
    // Signed with the right secret, but it expired one second before it was issued.
    const expired = await jwt.signAsync({ sub: userId }, { expiresIn: -1 });
    await expect(
      guard.canActivate(contextFor('privateRoute', `Bearer ${expired}`).context),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a valid token whose account was deleted', async () => {
    const token = await jwt.signAsync({ sub: userId });
    await users.delete(userId);
    await expect(
      guard.canActivate(contextFor('privateRoute', `Bearer ${token}`).context),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
