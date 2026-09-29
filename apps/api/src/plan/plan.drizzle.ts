import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { users } from '../db/schema';
import type { PlanRepository } from './plan.repository';

@Injectable()
export class DrizzlePlanRepository implements PlanRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getCompletedCount(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ completedCount: users.completedCount })
      .from(users)
      .where(eq(users.id, userId));
    return row?.completedCount ?? 0;
  }

  async advanceFrom(userId: string, expected: number): Promise<number> {
    const [row] = await this.db
      .update(users)
      .set({ completedCount: sql`${users.completedCount} + 1` })
      .where(and(eq(users.id, userId), eq(users.completedCount, expected)))
      .returning({ completedCount: users.completedCount });
    // No row changed: a concurrent request advanced it first. Report where it is now.
    return row ? row.completedCount : this.getCompletedCount(userId);
  }

  async reset(userId: string): Promise<void> {
    await this.db.update(users).set({ completedCount: 0 }).where(eq(users.id, userId));
  }
}
