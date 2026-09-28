import { z } from 'zod';
import { COACH_ROLES, type CoachMessage } from '../domain';

export const coachMessageSchema = z.object({
  id: z.string(),
  role: z.enum(COACH_ROLES),
  text: z.string(),
  createdAt: z.iso.datetime(),
}) satisfies z.ZodType<CoachMessage>;

export const sendCoachMessageBodySchema = z.object({
  text: z
    .string('Type a message first.')
    .trim()
    .min(1, 'Type a message first.')
    .max(500, 'Keep it under 500 characters.'),
});
export type SendCoachMessageBody = z.infer<typeof sendCoachMessageBodySchema>;

export const coachHistoryResponseSchema = z.object({
  messages: z.array(coachMessageSchema),
});
export type CoachHistoryResponse = z.infer<typeof coachHistoryResponseSchema>;

export const sendCoachMessageResponseSchema = z.object({
  message: coachMessageSchema,
  reply: coachMessageSchema,
});
export type SendCoachMessageResponse = z.infer<typeof sendCoachMessageResponseSchema>;
