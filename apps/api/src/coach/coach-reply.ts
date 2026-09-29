import { GOALS, type Goal } from '@forge/contracts';

// The "model" behind the coach: a pure, deterministic function of what the user said and
// where they are. No randomness — the same input always produces the same reply.

export interface NextSession {
  title: string;
  durationMinutes: number;
  blockCount: number;
}

export interface CoachContext {
  displayName: string | null;
  goals: Goal[];
  completedCount: number;
  totalCount: number;
  next: NextSession | null; // null when the plan is complete
  firstSessionTitle: string;
}

export type Intent = 'recovery' | 'warmUp' | 'shortOnTime' | 'consistency' | 'next' | 'fallback';

// First match wins, so the order is the precedence.
const INTENT_KEYWORDS: [Exclude<Intent, 'fallback'>, string[]][] = [
  ['recovery', ['sore', 'pain', 'hurt', 'rest', 'recover']],
  ['warmUp', ['warm', 'mobility', 'stretch']],
  ['shortOnTime', ['time', 'busy', 'quick', 'short', 'minutes']],
  ['consistency', ['consisten', 'habit', 'motivat', 'skip', 'tired']],
  ['next', ['next', 'today', 'session', 'plan']],
];

const GOAL_PHRASES: Record<Goal, string> = {
  get_stronger: 'getting stronger',
  move_daily: 'moving every day',
  build_habit: 'building a habit that sticks',
};

export function detectIntent(message: string): Intent {
  const text = message.toLowerCase();
  const match = INTENT_KEYWORDS.find(([, words]) => words.some((word) => text.includes(word)));
  return match?.[0] ?? 'fallback';
}

/** "a", "a and b" or "a, b and c" in GOALS order; "training" when there are no goals. */
export function goalsPhrase(goals: Goal[]): string {
  const phrases = GOALS.filter((goal) => goals.includes(goal)).map((goal) => GOAL_PHRASES[goal]);
  if (phrases.length === 0) return 'training';
  if (phrases.length === 1) return phrases[0];
  return `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
}

export function progressLine(context: CoachContext): string {
  const { completedCount, totalCount, next, firstSessionTitle } = context;
  if (completedCount === 0)
    return `You haven't started yet — ${next?.title ?? firstSessionTitle} is open.`;
  if (!next) return `You've completed all ${totalCount} sessions.`;
  return `You've completed ${completedCount} of ${totalCount} sessions; ${next.title} is up next.`;
}

export function composeCoachReply(context: CoachContext, message: string): string {
  const name = context.displayName ?? 'there';
  const goals = goalsPhrase(context.goals);
  const { next } = context;

  const bodies: Record<Intent, () => string> = {
    recovery: () =>
      `${name}, some soreness after a new session is normal; sharp pain isn't — stop and get it checked. Easy walking helps you recover and keep ${goals}.`,
    warmUp: () =>
      `Start easy, ${name}: five minutes of mobility for hips, shoulders and ankles, then a few slow reps of your first exercise. It's the cheapest win for ${goals}.`,
    shortOnTime: () =>
      `Short on time, ${name}? Do the warm-up and main set of ${next?.title ?? context.firstSessionTitle} and skip the rest. Consistency beats length when you're ${goals}.`,
    consistency: () =>
      `${name}, tie training to something you already do every day and keep the bar low — one session this week is a real win for ${goals}.`,
    next: () =>
      next
        ? `${name}, your next session is ${next.title}: ${next.durationMinutes} minutes across ${next.blockCount} blocks, built for ${goals}. Keep the main set steady and finish every block.`
        : `${name}, the plan is done. Restart it from the Plan tab and aim for smoother reps on the second pass — that's how progress compounds when you're ${goals}.`,
    fallback: () =>
      `Good question, ${name}. I can help with your next session, warming up, short workouts or staying consistent while you're ${goals}.`,
  };

  return `${bodies[detectIntent(message)]()} ${progressLine(context)}`;
}
