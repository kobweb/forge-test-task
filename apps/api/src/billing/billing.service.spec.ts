import { InMemoryBillingRepository } from '../../test/in-memory/in-memory-billing.repository';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  const now = new Date('2026-09-29T10:00:00.000Z');
  let service: BillingService;

  beforeEach(() => {
    jest.useFakeTimers({ now });
    service = new BillingService(new InMemoryBillingRepository());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts everyone on the free tier', async () => {
    await expect(service.get('alex')).resolves.toEqual({
      tier: 'free',
      productId: null,
      trialEndsAt: null,
    });
  });

  it('a purchase grants Plus with a 7-day trial', async () => {
    await expect(service.purchase('alex', 'forge_plus_yearly')).resolves.toEqual({
      tier: 'plus',
      productId: 'forge_plus_yearly',
      trialEndsAt: '2026-10-06T10:00:00.000Z',
    });
    await expect(service.get('alex')).resolves.toMatchObject({ tier: 'plus' });
  });

  it('switching products keeps the original trial end (one trial per account)', async () => {
    await service.purchase('alex', 'forge_plus_yearly');
    jest.setSystemTime(new Date('2026-10-01T10:00:00.000Z'));
    await expect(service.purchase('alex', 'forge_plus_monthly')).resolves.toEqual({
      tier: 'plus',
      productId: 'forge_plus_monthly',
      trialEndsAt: '2026-10-06T10:00:00.000Z',
    });
  });

  it('restore returns what the account already owns', async () => {
    await expect(service.restore('alex')).resolves.toMatchObject({ tier: 'free' });
    await service.purchase('alex', 'forge_plus_monthly');
    await expect(service.restore('alex')).resolves.toMatchObject({
      tier: 'plus',
      productId: 'forge_plus_monthly',
    });
  });

  it('keeps each user’s entitlement separate', async () => {
    await service.purchase('alex', 'forge_plus_yearly');
    await expect(service.get('sam')).resolves.toMatchObject({ tier: 'free' });
  });
});
