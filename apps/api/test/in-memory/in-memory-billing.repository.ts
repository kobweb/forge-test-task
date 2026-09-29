import type { BillingRepository, PurchaseRecord } from '../../src/billing/billing.repository';

export class InMemoryBillingRepository implements BillingRepository {
  private readonly purchases = new Map<string, PurchaseRecord>();

  find(userId: string): Promise<PurchaseRecord | null> {
    const found = this.purchases.get(userId);
    return Promise.resolve(found ? { ...found } : null);
  }

  upsert(userId: string, purchase: PurchaseRecord): Promise<PurchaseRecord> {
    this.purchases.set(userId, { ...purchase });
    return Promise.resolve({ ...purchase });
  }
}
