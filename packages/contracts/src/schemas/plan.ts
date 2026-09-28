import { z } from 'zod';
import {
  BLOCK_KINDS,
  SESSION_IDS,
  SESSION_STATUSES,
  type PlanSession,
  type PlanView,
  type SessionBlock,
} from '../domain';

export const sessionIdSchema = z.enum(SESSION_IDS);

export const sessionBlockSchema = z.object({
  kind: z.enum(BLOCK_KINDS),
  title: z.string(),
  detail: z.string(),
}) satisfies z.ZodType<SessionBlock>;

export const planSessionSchema = z.object({
  id: sessionIdSchema,
  number: z.number().int().positive(),
  title: z.string(),
  subtitle: z.string(),
  durationMinutes: z.number().int().positive(),
  blocks: z.array(sessionBlockSchema),
  status: z.enum(SESSION_STATUSES),
}) satisfies z.ZodType<PlanSession>;

export const planViewSchema = z.object({
  sessions: z.array(planSessionSchema),
  completedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  nextSessionId: sessionIdSchema.nullable(),
}) satisfies z.ZodType<PlanView>;
