import { COACH_ROLES, GOALS, PRODUCT_IDS } from '@forge/contracts';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Enum values come from the contracts tuples, so database and wire values cannot drift.
export const goalEnum = pgEnum('goal', GOALS);
export const productIdEnum = pgEnum('product_id', PRODUCT_IDS);
export const coachRoleEnum = pgEnum('coach_role', COACH_ROLES);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    consentAcceptedAt: timestamp('consent_accepted_at', { withTimezone: true }),
    // Decision A: the only plan state. Session statuses are derived from it.
    completedCount: integer('completed_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('users_completed_count_non_negative', sql`${table.completedCount} >= 0`)],
);

export const userGoals = pgTable(
  'user_goals',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goal: goalEnum('goal').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.goal] })],
);

export const coachMessages = pgTable(
  'coach_messages',
  {
    // Identity, not uuid: insertion order is conversation order, even when timestamps tie.
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: coachRoleEnum('role').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('coach_messages_user_id_id_idx').on(table.userId, table.id)],
);

// A row exists if and only if the user has Plus.
export const entitlements = pgTable('entitlements', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: productIdEnum('product_id').notNull(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }).notNull(),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
});
