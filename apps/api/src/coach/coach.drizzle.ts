import type { CoachRole } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { coachMessages } from '../db/schema';
import type { CoachMessageRecord, CoachRepository } from './coach.repository';

const columns = {
  id: coachMessages.id,
  role: coachMessages.role,
  text: coachMessages.text,
  createdAt: coachMessages.createdAt,
};

@Injectable()
export class DrizzleCoachRepository implements CoachRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listRecent(userId: string, limit: number): Promise<CoachMessageRecord[]> {
    const newestFirst = await this.db
      .select(columns)
      .from(coachMessages)
      .where(eq(coachMessages.userId, userId))
      .orderBy(desc(coachMessages.id))
      .limit(limit);
    return newestFirst.reverse();
  }

  async append(userId: string, role: CoachRole, text: string): Promise<CoachMessageRecord> {
    const [row] = await this.db
      .insert(coachMessages)
      .values({ userId, role, text })
      .returning(columns);
    return row;
  }
}
