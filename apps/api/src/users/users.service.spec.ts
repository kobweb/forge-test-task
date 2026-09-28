import { updateMeBodySchema } from '@forge/contracts';
import { InMemoryUsersRepository } from '../../test/in-memory/in-memory-users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let repository: InMemoryUsersRepository;
  let service: UsersService;
  let userId: string;

  beforeEach(async () => {
    repository = new InMemoryUsersRepository();
    service = new UsersService(repository);
    userId = (await repository.create({ email: 'alex@forge.test', passwordHash: 'hash' })).id;
  });

  // The controller runs every body through this schema first; the tests do the same.
  const body = (input: unknown) => updateMeBodySchema.parse(input);

  it('returns a fresh user with no goals and not onboarded', async () => {
    await expect(service.getMe(userId)).resolves.toEqual({
      id: userId,
      email: 'alex@forge.test',
      displayName: null,
      goals: [],
      consentAcceptedAt: null,
      onboarded: false,
    });
  });

  it('marks the user onboarded once name, at least one goal and consent are set', async () => {
    const user = await service.updateMe(
      userId,
      body({ displayName: 'Alex', goals: ['move_daily'], acceptConsent: true }),
    );
    expect(user.onboarded).toBe(true);
    expect(user.consentAcceptedAt).toEqual(expect.any(String));
  });

  it('is not onboarded while any of the three is missing', async () => {
    const withoutConsent = await service.updateMe(
      userId,
      body({ displayName: 'Alex', goals: ['move_daily'] }),
    );
    expect(withoutConsent.onboarded).toBe(false);
  });

  it('replaces the whole goals set and returns it in GOALS order', async () => {
    await service.updateMe(userId, body({ goals: ['build_habit', 'get_stronger'] }));
    const user = await service.updateMe(userId, body({ goals: ['move_daily', 'get_stronger'] }));
    expect(user.goals).toEqual(['get_stronger', 'move_daily']);
  });

  it('leaves fields that are not in the body as they were', async () => {
    await service.updateMe(userId, body({ displayName: 'Alex', goals: ['build_habit'] }));
    const user = await service.updateMe(userId, body({ displayName: 'Sam' }));
    expect(user).toMatchObject({ displayName: 'Sam', goals: ['build_habit'] });
  });

  it('sets the consent timestamp once and keeps the first date', async () => {
    const first = await service.updateMe(userId, body({ acceptConsent: true }));
    const second = await service.updateMe(userId, body({ acceptConsent: true }));
    expect(second.consentAcceptedAt).toBe(first.consentAcceptedAt);
  });

  it('deletes the user', async () => {
    await service.deleteMe(userId);
    await expect(repository.findById(userId)).resolves.toBeNull();
  });

  it('rejects a user that no longer exists as UNAUTHORIZED', async () => {
    await service.deleteMe(userId);
    await expect(service.getMe(userId)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
