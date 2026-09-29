import type { SessionBlock, SessionId } from '@forge/contracts';

export interface SessionTemplate {
  id: SessionId;
  title: string;
  subtitle: string;
  durationMinutes: number;
  blocks: SessionBlock[];
}

// The whole plan. Order is the unlock order; statuses are derived from users.completed_count.
export const PLAN_TEMPLATE: readonly SessionTemplate[] = [
  {
    id: 'foundation',
    title: 'Foundation',
    subtitle: 'Learn the moves, find your pace',
    durationMinutes: 25,
    blocks: [
      { kind: 'warm_up', title: 'Mobility flow', detail: '5 min · hips, shoulders and ankles' },
      {
        kind: 'main_set',
        title: 'Bodyweight basics',
        detail: '3 rounds · squat, push-up, row × 10',
      },
      { kind: 'cool_down', title: 'Breathe it out', detail: '5 min · easy stretch, long exhales' },
    ],
  },
  {
    id: 'build',
    title: 'Build',
    subtitle: 'Add volume, keep control',
    durationMinutes: 35,
    blocks: [
      { kind: 'warm_up', title: 'Dynamic prep', detail: '6 min · lunges, arm circles, skips' },
      {
        kind: 'main_set',
        title: 'Tempo strength',
        detail: '4 rounds · 3-second lowers on every rep',
      },
      { kind: 'finisher', title: 'Hold strong', detail: '3 × 40 s · plank or wall sit' },
      { kind: 'cool_down', title: 'Downshift', detail: '5 min · walk and stretch' },
    ],
  },
  {
    id: 'forge',
    title: 'Forge',
    subtitle: 'Put it all together',
    durationMinutes: 40,
    blocks: [
      { kind: 'warm_up', title: 'Ramp up', detail: '8 min · build to working pace' },
      {
        kind: 'main_set',
        title: 'Strength complex',
        detail: '5 rounds · squat, push, hinge, pull',
      },
      { kind: 'finisher', title: 'Intervals', detail: '6 × 20 s hard, 40 s easy' },
      { kind: 'cool_down', title: 'Reset', detail: '6 min · mobility and slow breathing' },
    ],
  },
];
