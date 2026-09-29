import { composeCoachReply, detectIntent, goalsPhrase, type CoachContext } from './coach-reply';

const context = (overrides: Partial<CoachContext> = {}): CoachContext => ({
  displayName: 'Alex',
  goals: ['get_stronger', 'move_daily'],
  completedCount: 1,
  totalCount: 3,
  next: { title: 'Build', durationMinutes: 35, blockCount: 4 },
  firstSessionTitle: 'Foundation',
  ...overrides,
});

describe('goalsPhrase', () => {
  it.each([
    [[], 'training'],
    [['move_daily'], 'moving every day'],
    [['move_daily', 'get_stronger'], 'getting stronger and moving every day'],
    [
      ['build_habit', 'move_daily', 'get_stronger'],
      'getting stronger, moving every day and building a habit that sticks',
    ],
  ] as const)('%j → %s', (goals, phrase) => {
    expect(goalsPhrase([...goals])).toBe(phrase);
  });
});

describe('detectIntent', () => {
  it.each([
    ["I'm sore after my session", 'recovery'],
    ['Sore legs', 'recovery'], // matching ignores case
    ['How should I warm up for my next session?', 'warmUp'],
    ['I only have 15 minutes today', 'shortOnTime'],
    ['How do I stay consistent?', 'consistency'],
    ['I keep skipping my session', 'consistency'], // "session" matches next too: first match wins
    ["What's my next session?", 'next'],
    ['Hello!', 'fallback'],
  ])('%s → %s', (message, intent) => {
    expect(detectIntent(message)).toBe(intent);
  });
});

describe('composeCoachReply', () => {
  it.each([
    "I'm sore after my session",
    'How should I warm up?',
    'I only have 15 minutes',
    'How do I stay consistent?',
    "What's my next session?",
    'Hello!',
  ])('names the user, every goal and the progress for %p', (message) => {
    const reply = composeCoachReply(context(), message);
    expect(reply).toContain('Alex');
    expect(reply).toContain('getting stronger');
    expect(reply).toContain('moving every day');
    expect(reply).toContain("You've completed 1 of 3 sessions; Build is up next.");
  });

  it('is deterministic: the same input gives the same reply', () => {
    expect(composeCoachReply(context(), 'What now?')).toBe(
      composeCoachReply(context(), 'What now?'),
    );
  });

  it('describes the next session with its duration and blocks', () => {
    expect(composeCoachReply(context(), "What's next?")).toContain(
      'your next session is Build: 35 minutes across 4 blocks',
    );
  });

  it('points to a restart once the plan is complete', () => {
    const done = context({ completedCount: 3, next: null });
    const reply = composeCoachReply(done, "What's my next session?");
    expect(reply).toContain('the plan is done. Restart it from the Plan tab');
    expect(reply).toContain("You've completed all 3 sessions.");
  });

  it('sends a short-on-time user to the next session mid-plan', () => {
    expect(composeCoachReply(context(), 'I am busy')).toContain('main set of Build');
  });

  it('sends a short-on-time user to Foundation when the plan is complete', () => {
    const done = context({ completedCount: 3, next: null });
    expect(composeCoachReply(done, 'I am busy')).toContain('main set of Foundation');
  });

  it('greets a user who has not started yet', () => {
    const fresh = context({
      completedCount: 0,
      next: { title: 'Foundation', durationMinutes: 25, blockCount: 3 },
    });
    expect(composeCoachReply(fresh, 'Hi')).toContain(
      "You haven't started yet — Foundation is open.",
    );
  });

  it('falls back to "there" and "training" without a name or goals', () => {
    const reply = composeCoachReply(context({ displayName: null, goals: [] }), 'Hello!');
    expect(reply).toContain('Good question, there.');
    expect(reply).toContain("while you're training.");
  });
});
