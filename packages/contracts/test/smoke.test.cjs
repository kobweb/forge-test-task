// Proves @forge/contracts is built and importable from both apps' directories, and pins the
// request-schema normalisation both apps rely on. Run with `pnpm test` (builds first).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../../..');

const planFixture = {
  sessions: [
    {
      id: 'foundation',
      number: 1,
      title: 'Foundation',
      subtitle: 'Learn the moves, find your pace',
      durationMinutes: 25,
      blocks: [{ kind: 'warm_up', title: 'Mobility flow', detail: '5 min' }],
      status: 'open',
    },
  ],
  completedCount: 0,
  totalCount: 3,
  nextSessionId: 'foundation',
};

for (const app of ['apps/api', 'apps/mobile']) {
  const appDir = path.join(repoRoot, app);
  // Plan 0 scaffolds the apps after this package; until then these two checks are skipped.
  const skip = existsSync(path.join(appDir, 'package.json')) ? false : `${app} not scaffolded yet`;
  test(`@forge/contracts resolves and loads from ${app}`, { skip }, () => {
    const entry = require.resolve('@forge/contracts', { paths: [appDir] });
    const contracts = require(entry);
    assert.equal(contracts.planViewSchema.parse(planFixture).nextSessionId, 'foundation');
    assert.equal(contracts.routes.plan.complete('build'), '/plan/sessions/build/complete');
  });
}

test('request schemas normalise input the way both apps rely on', () => {
  const contracts = require('..');
  assert.equal(contracts.emailSchema.parse('  Alex@Example.COM '), 'alex@example.com');
  assert.deepEqual(contracts.goalsSchema.parse(['move_daily', 'get_stronger', 'move_daily']), [
    'get_stronger',
    'move_daily',
  ]);
  assert.equal(
    contracts.goalsSchema.safeParse([]).error.issues[0].message,
    'Pick at least one goal.',
  );
  assert.equal(contracts.newPasswordSchema.safeParse('é'.repeat(37)).success, false); // 74 bytes
  assert.equal(
    contracts.updateMeBodySchema.safeParse({}).error.issues[0].message,
    'Nothing to update.',
  );
  assert.equal(
    contracts.onboardingBodySchema.safeParse({
      displayName: 'Alex',
      goals: ['move_daily'],
      acceptConsent: false,
    }).error.issues[0].message,
    'Please accept to continue.',
  );
});
