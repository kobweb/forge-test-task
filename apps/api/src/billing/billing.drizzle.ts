import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { entitlements } from '../db/schema';
import type { BillingRepository, PurchaseRecord } from './billing.repository';

@Injectable()
export class DrizzleBillingRepository implements BillingRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async find(userId: string): Promise<PurchaseRecord | null> {
    const [row] = await this.db
      .select({ productId: entitlements.productId, trialEndsAt: entitlements.trialEndsAt })
      .from(entitlements)
      .where(eq(entitlements.userId, userId));
    return row ?? null;
  }

  async upsert(userId: string, purchase: PurchaseRecord): Promise<PurchaseRecord> {
    const [row] = await this.db
      .insert(entitlements)
      .values({ userId, ...purchase })
      .onConflictDoUpdate({ target: entitlements.userId, set: purchase })
      .returning({ productId: entitlements.productId, trialEndsAt: entitlements.trialEndsAt });
    return row;
  }
}
