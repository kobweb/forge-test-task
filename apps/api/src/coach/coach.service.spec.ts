import { updateMeBodySchema } from '@forge/contracts';
import { InMemoryBillingRepository } from '../../test/in-memory/in-memory-billing.repository';
import { InMemoryCoachRepository } from '../../test/in-memory/in-memory-coach.repository';
import { InMemoryPlanRepository } from '../../test/in-memory/in-memory-plan.repository';
import { InMemoryUsersRepository } from '../../test/in-memory/in-memory-users.repository';
import { BillingService } from '../billing/billing.service';
import { PlanService } from '../plan/plan.service';
import { UsersService } from '../users/users.service';
import { CoachService } from './coach.service';

describe('CoachService', () => {
  let messages: InMemoryCoachRepository;
  let users: UsersService;
  let plan: PlanService;
  let billing: BillingService;
  let delay: jest.Mock<Promise<void>, []>;
  let service: CoachService;
  let alex: string;

  beforeEach(async () => {
    const usersRepository = new InMemoryUsersRepository();
    messages = new InMemoryCoachRepository();
    users = new UsersService(usersRepository);
    plan = new PlanService(new InMemoryPlanRepository());
    billing = new BillingService(new InMemoryBillingRepository());
    delay = jest.fn(() => Promise.resolve());
    service = new CoachService(messages, users, plan, billing, delay);

    alex = (await usersRepository.create({ email: 'alex@forge.test', passwordHash: 'x' })).id;
    await users.updateMe(
      alex,
      updateMeBodySchema.parse({
        displayName: 'Alex',
        goals: ['build_habit'],
        acceptConsent: true,
      }),
    );
  });

  it('refuses a free user on both history and send', async () => {
    await expect(service.history(alex)).rejects.toMatchObject({ code: 'PLUS_REQUIRED' });
    await expect(service.send(alex, 'Hi')).rejects.toMatchObject({ code: 'PLUS_REQUIRED' });
  });

  describe('with Plus', () => {
    beforeEach(async () => {
      await billing.purchase(alex, 'forge_plus_monthly');
    });

    it('stores the message, waits the simulated latency, then stores the reply', async () => {
      delay.mockImplementation(async () => {
        // During the "thinking" time only the user's message exists.
        expect(await messages.listRecent(alex, 10)).toHaveLength(1);
      });
      const { message, reply } = await service.send(alex, "What's my next session?");
      expect(delay).toHaveBeenCalledTimes(1);
      expect(message).toMatchObject({ role: 'user', text: "What's my next session?" });
      expect(reply.role).toBe('coach');
      expect(await messages.listRecent(alex, 10)).toHaveLength(2);
    });

    it('replies with the user’s name, goals and current progress', async () => {
      await plan.complete(alex, 'foundation');
      const { reply } = await service.send(alex, "What's my next session?");
      expect(reply.text).toContain('Alex');
      expect(reply.text).toContain('building a habit that sticks');
      expect(reply.text).toContain('your next session is Build: 35 minutes across 4 blocks');
    });

    it('returns the history oldest first, with string ids and ISO timestamps', async () => {
      await service.send(alex, 'First');
      await service.send(alex, 'Second');
      const history = await service.history(alex);
      expect(history.map((message) => message.role)).toEqual(['user', 'coach', 'user', 'coach']);
      expect(typeof history[0].id).toBe('string');
      expect(history[0].text).toBe('First');
      expect(new Date(history[0].createdAt).toISOString()).toBe(history[0].createdAt);
    });

    it('caps the history at the latest 100 messages', async () => {
      for (let i = 0; i < 51; i++) await service.send(alex, `Message ${i}`);
      const history = await service.history(alex);
      expect(history).toHaveLength(100);
      expect(history[0].text).toBe('Message 1');
    });

    it('never shows one user another user’s messages', async () => {
      await service.send(alex, 'Private to Alex');
      await billing.purchase('sam', 'forge_plus_monthly');
      await expect(service.history('sam')).resolves.toEqual([]);
    });
  });
});
