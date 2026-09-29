import { InMemoryPlanRepository } from '../../test/in-memory/in-memory-plan.repository';
import { PlanService } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;
  const alex = 'user-alex';
  const sam = 'user-sam';

  beforeEach(() => {
    service = new PlanService(new InMemoryPlanRepository());
  });

  const statuses = async (userId: string) =>
    (await service.getPlan(userId)).sessions.map((session) => session.status);

  it('opens Foundation for a fresh user and locks the rest', async () => {
    const plan = await service.getPlan(alex);
    expect(plan.sessions.map((session) => session.id)).toEqual(['foundation', 'build', 'forge']);
    expect(plan.sessions.map((session) => session.number)).toEqual([1, 2, 3]);
    expect(plan).toMatchObject({ completedCount: 0, totalCount: 3, nextSessionId: 'foundation' });
    await expect(statuses(alex)).resolves.toEqual(['open', 'locked', 'locked']);
  });

  it('completing the open session unlocks the next one', async () => {
    const plan = await service.complete(alex, 'foundation');
    expect(plan).toMatchObject({ completedCount: 1, nextSessionId: 'build' });
    expect(plan.sessions.map((session) => session.status)).toEqual(['completed', 'open', 'locked']);
  });

  it('completing an already completed session is a no-op', async () => {
    await service.complete(alex, 'foundation');
    const plan = await service.complete(alex, 'foundation');
    expect(plan).toMatchObject({ completedCount: 1, nextSessionId: 'build' });
  });

  it('refuses to complete a locked session and names the one to finish first', async () => {
    await expect(service.complete(alex, 'forge')).rejects.toMatchObject({
      code: 'SESSION_LOCKED',
      message: 'Finish Foundation first.',
    });
    await expect(statuses(alex)).resolves.toEqual(['open', 'locked', 'locked']);
  });

  it('rejects an unknown session id', async () => {
    await expect(service.complete(alex, 'marathon')).rejects.toMatchObject({
      code: 'SESSION_NOT_FOUND',
    });
  });

  it('has no next session once all three are complete, and reset starts over', async () => {
    for (const id of ['foundation', 'build', 'forge']) await service.complete(alex, id);
    const done = await service.getPlan(alex);
    expect(done).toMatchObject({ completedCount: 3, nextSessionId: null });
    const restarted = await service.reset(alex);
    expect(restarted).toMatchObject({ completedCount: 0, nextSessionId: 'foundation' });
  });

  it('advances only once when the same completion arrives twice at the same time', async () => {
    await Promise.all([service.complete(alex, 'foundation'), service.complete(alex, 'foundation')]);
    await expect(service.getPlan(alex)).resolves.toMatchObject({ completedCount: 1 });
  });

  it('keeps each user’s progress separate', async () => {
    await service.complete(alex, 'foundation');
    await expect(statuses(sam)).resolves.toEqual(['open', 'locked', 'locked']);
  });
});
