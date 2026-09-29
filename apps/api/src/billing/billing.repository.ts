import type { ProductId } from '@forge/contracts';

export const BILLING_REPOSITORY = Symbol('BILLING_REPOSITORY');

// A stored mock purchase. Its existence is what makes a user Plus.
export interface PurchaseRecord {
  productId: ProductId;
  trialEndsAt: Date;
}

export interface BillingRepository {
  find(userId: string): Promise<PurchaseRecord | null>;
  /** Inserts the purchase, or overwrites the existing one for this user. */
  upsert(userId: string, purchase: PurchaseRecord): Promise<PurchaseRecord>;
}
