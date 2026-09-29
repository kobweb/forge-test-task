import type { Entitlement, ProductId } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import {
  BILLING_REPOSITORY,
  type BillingRepository,
  type PurchaseRecord,
} from './billing.repository';

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

// Mock billing: no store, no charge. The purchase record lives on the server, so the server
// stays the source of truth for the entitlement, as it would with real store receipts.
@Injectable()
export class BillingService {
  constructor(@Inject(BILLING_REPOSITORY) private readonly purchases: BillingRepository) {}

  async get(userId: string): Promise<Entitlement> {
    return toEntitlement(await this.purchases.find(userId));
  }

  async purchase(userId: string, productId: ProductId): Promise<Entitlement> {
    const existing = await this.purchases.find(userId);
    // One trial per account: switching products keeps the original trial end.
    const trialEndsAt = existing?.trialEndsAt ?? new Date(Date.now() + TRIAL_DAYS * DAY_MS);
    return toEntitlement(await this.purchases.upsert(userId, { productId, trialEndsAt }));
  }

  // In production this would re-validate store receipts. Here the record is already on the
  // server, so restoring means re-reading it; the app says "nothing to restore" if still free.
  restore(userId: string): Promise<Entitlement> {
    return this.get(userId);
  }
}

export function toEntitlement(purchase: PurchaseRecord | null): Entitlement {
  return purchase
    ? {
        tier: 'plus',
        productId: purchase.productId,
        trialEndsAt: purchase.trialEndsAt.toISOString(),
      }
    : { tier: 'free', productId: null, trialEndsAt: null };
}
