import { loginBodySchema, signupBodySchema } from '@forge/contracts';
import { JwtService } from '@nestjs/jwt';
import { InMemoryUsersRepository } from '../../test/in-memory/in-memory-users.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'unit-test-secret-at-least-32-chars!' });
  let users: InMemoryUsersRepository;
  let service: AuthService;

  beforeEach(() => {
    users = new InMemoryUsersRepository();
    service = new AuthService(users, jwt);
  });

  // The controller runs every body through these schemas first; the tests do the same.
  const signup = (email: string, password = 'correct horse battery') =>
    service.signup(signupBodySchema.parse({ email, password }));
  const login = (email: string, password = 'correct horse battery') =>
    service.login(loginBodySchema.parse({ email, password }));

  it('signs up with a lowercased email and stores a hash, not the password', async () => {
    const { user } = await signup(' Alex@Forge.TEST ');
    const stored = await users.findById(user.id);
    expect(user.email).toBe('alex@forge.test');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(stored?.passwordHash).not.toContain('correct horse');
  });

  it('returns a token whose subject is the new user and a not-yet-onboarded user', async () => {
    const { token, user } = await signup('alex@forge.test');
    await expect(jwt.verifyAsync<{ sub: string }>(token)).resolves.toMatchObject({ sub: user.id });
    expect(user.onboarded).toBe(false);
  });

  it('rejects a second signup with the same email as EMAIL_TAKEN', async () => {
    await signup('alex@forge.test');
    await expect(signup('ALEX@forge.test')).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it('logs in with the right password, whatever the email casing', async () => {
    const { user } = await signup('alex@forge.test');
    const session = await login('Alex@Forge.Test');
    expect(session.user.id).toBe(user.id);
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    await signup('alex@forge.test');
    await expect(login('alex@forge.test', 'wrong password')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
    });
    await expect(login('nobody@forge.test')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
    });
  });
});
