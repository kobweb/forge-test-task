import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAnalytics, type AnalyticsRecord } from './core.ts';

const NOW = new Date('2026-09-30T10:00:00.000Z');

function setup() {
  const sent: AnalyticsRecord[] = [];
  const analytics = createAnalytics({ send: (record) => sent.push(record) }, () => NOW);
  return { analytics, sent };
}

test('sends nothing while the choice is unknown', () => {
  const { analytics, sent } = setup();
  analytics.track('app_opened');
  analytics.track('screen_viewed', { path: '/sign-in' });
  assert.deepEqual(sent, []);
});

test('granting consent flushes the queue in order, stamped with the user id', () => {
  const { analytics, sent } = setup();
  analytics.track('app_opened');
  analytics.track('sign_up_completed');
  analytics.identify('user-1');
  analytics.setConsent('granted');
  assert.deepEqual(sent, [
    { name: 'app_opened', props: {}, timestamp: NOW.toISOString(), userId: 'user-1' },
    { name: 'sign_up_completed', props: {}, timestamp: NOW.toISOString(), userId: 'user-1' },
  ]);
});

test('once granted, events go straight to the sink with their properties', () => {
  const { analytics, sent } = setup();
  analytics.identify('user-1');
  analytics.setConsent('granted');
  analytics.track('onboarding_completed', { goalCount: 2 });
  assert.deepEqual(sent, [
    {
      name: 'onboarding_completed',
      props: { goalCount: 2 },
      timestamp: NOW.toISOString(),
      userId: 'user-1',
    },
  ]);
});

test('denying consent drops the queue and ignores later events', () => {
  const { analytics, sent } = setup();
  analytics.track('app_opened');
  analytics.setConsent('denied');
  analytics.track('plan_restarted');
  assert.deepEqual(sent, []);
});

test('turning consent on later does not backfill what was dropped or ignored', () => {
  const { analytics, sent } = setup();
  analytics.track('app_opened');
  analytics.setConsent('denied');
  analytics.track('plan_restarted');
  analytics.setConsent('granted');
  analytics.track('logged_out');
  assert.deepEqual(
    sent.map((record) => record.name),
    ['logged_out'],
  );
});

test('the queue keeps only the newest 100 events', () => {
  const { analytics, sent } = setup();
  for (let index = 0; index < 105; index += 1) {
    analytics.track('screen_viewed', { path: `/screen-${index}` });
  }
  analytics.setConsent('granted');
  assert.equal(sent.length, 100);
  assert.deepEqual(sent[0].props, { path: '/screen-5' });
  assert.deepEqual(sent[99].props, { path: '/screen-104' });
});

test('reset forgets the queue, the identity and the choice', () => {
  const { analytics, sent } = setup();
  analytics.identify('user-1');
  analytics.setConsent('granted');
  analytics.reset();
  analytics.track('app_opened');
  assert.deepEqual(sent, []);
  analytics.setConsent('granted');
  assert.deepEqual(sent, [
    { name: 'app_opened', props: {}, timestamp: NOW.toISOString(), userId: null },
  ]);
});

test('events carry no user id before identify', () => {
  const { analytics, sent } = setup();
  analytics.setConsent('granted');
  analytics.track('app_opened');
  assert.equal(sent[0].userId, null);
});
