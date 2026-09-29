import type { Goal } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { AppError } from '../common/app-error';
import { DB, type Database } from '../db/db.module';
import { isUniqueViolation } from '../db/postgres-errors';
import { userGoals, users } from '../db/schema';
import type { NewUser, UserChanges, UserRecord, UsersRepository } from './users.repository';

type UserRow = typeof users.$inferSelect;
type Reader = Pick<Database, 'select'>;

@Injectable()
export class DrizzleUsersRepository implements UsersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async create(user: NewUser): Promise<UserRecord> {
    try {
      const [row] = await this.db.insert(users).values(user).returning();
      return toRecord(row, []);
    } catch (error) {
      // Two signups racing past AuthService's pre-check: the unique index decides.
      if (isUniqueViolation(error)) {
        throw new AppError('EMAIL_TAKEN', 'An account with this email already exists.');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email));
    return row ? toRecord(row, await goalsOf(this.db, row.id)) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? toRecord(row, await goalsOf(this.db, row.id)) : null;
  }

  async update(id: string, changes: UserChanges): Promise<UserRecord | null> {
    // One transaction, so a reader never sees a half-replaced goals set.
    return this.db.transaction(async (tx) => {
      const { goals, ...columns } = changes;
      if (Object.keys(columns).length > 0) {
        await tx.update(users).set(columns).where(eq(users.id, id));
      }
      if (goals) {
        await tx.delete(userGoals).where(eq(userGoals.userId, id));
        if (goals.length > 0) {
          await tx.insert(userGoals).values(goals.map((goal) => ({ userId: id, goal })));
        }
      }
      const [row] = await tx.select().from(users).where(eq(users.id, id));
      return row ? toRecord(row, await goalsOf(tx, id)) : null;
    });
  }

  async delete(id: string): Promise<void> {
    // user_goals, coach_messages and entitlements go with it (ON DELETE CASCADE).
    await this.db.delete(users).where(eq(users.id, id));
  }
}

// Postgres orders enum values by declaration order, which is GOALS order.
async function goalsOf(reader: Reader, userId: string): Promise<Goal[]> {
  const rows = await reader
    .select({ goal: userGoals.goal })
    .from(userGoals)
    .where(eq(userGoals.userId, userId))
    .orderBy(asc(userGoals.goal));
  return rows.map((row) => row.goal);
}

function toRecord(row: UserRow, goals: Goal[]): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    displayName: row.displayName,
    goals,
    consentAcceptedAt: row.consentAcceptedAt,
    createdAt: row.createdAt,
  };
}
