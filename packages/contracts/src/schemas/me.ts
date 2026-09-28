import { z } from 'zod';
import { GOALS, type Goal, type User } from '../domain';

export const displayNameSchema = z
  .string('Tell us what to call you.')
  .trim()
  .min(1, 'Tell us what to call you.')
  .max(40, 'Keep it under 40 characters.');

export const goalSchema = z.enum(GOALS);

const byGoalOrder = (a: Goal, b: Goal): number => GOALS.indexOf(a) - GOALS.indexOf(b);

// A set of goals: duplicates are dropped and the output is always in GOALS order.
export const goalsSchema = z
  .array(goalSchema, 'Pick at least one goal.')
  .min(1, 'Pick at least one goal.')
  .max(GOALS.length, 'Pick at most three goals.')
  .transform((goals) => [...new Set(goals)].sort(byGoalOrder));

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  goals: z.array(goalSchema),
  consentAcceptedAt: z.iso.datetime().nullable(),
  onboarded: z.boolean(),
}) satisfies z.ZodType<User>;

export const updateMeBodySchema = z
  .object({
    displayName: displayNameSchema.optional(),
    goals: goalsSchema.optional(),
    acceptConsent: z.literal(true).optional(),
  })
  .refine(
    (body) =>
      body.displayName !== undefined ||
      body.goals !== undefined ||
      body.acceptConsent !== undefined,
    'Nothing to update.',
  );
export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;

// The onboarding form: every field required. Its output is always a valid UpdateMeBody.
// acceptConsent takes a checkbox boolean as input and only lets `true` through.
export const onboardingBodySchema = z.object({
  displayName: displayNameSchema,
  goals: goalsSchema,
  acceptConsent: z
    .boolean('Please accept to continue.')
    .pipe(z.literal(true, 'Please accept to continue.')),
});
export type OnboardingBody = z.infer<typeof onboardingBodySchema>;
