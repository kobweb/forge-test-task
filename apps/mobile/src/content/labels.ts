import type { BlockKind, Goal } from '@forge/contracts';

export const GOAL_LABELS: Record<Goal, { title: string; description: string }> = {
  get_stronger: { title: 'Get stronger', description: 'Build strength you can feel week to week.' },
  move_daily: { title: 'Move daily', description: 'Keep your body moving, even on busy days.' },
  build_habit: { title: 'Build a habit', description: 'Show up consistently until it sticks.' },
};

export const BLOCK_LABELS: Record<BlockKind, string> = {
  warm_up: 'Warm-up',
  main_set: 'Main set',
  finisher: 'Finisher',
  cool_down: 'Cool-down',
};

export const SUGGESTED_PROMPTS = [
  "What's my next session?",
  'How should I warm up?',
  'I only have 15 minutes',
  'How do I stay consistent?',
] as const;

export const COACH_BENEFITS = [
  'Answers that know your goals and progress',
  'Help on warm-ups, short workouts and recovery',
  'Your conversation history, private to you',
] as const;
