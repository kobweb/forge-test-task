# Plan C — Permissions and Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After onboarding the app asks for notification permission, usage analytics and (iOS)
App Tracking Transparency, one screen each; Settings shows and changes the three choices; a mock
analytics service receives the product funnel, and nothing reaches it unless the user agreed.

**Architecture:** A React-Native-free analytics core (`createAnalytics(sink)`) owns the consent
gate and an in-memory queue; the app's singleton wires it to a console-and-buffer mock sink. A
persisted Zustand privacy store holds the analytics choice and "prompts done", pushes every change
into the core, and is reset on sign-out. A new guarded `permissions` route sits between onboarding
and the tabs. Expo's permission modules are reached only through `src/lib/permissions.ts`. Outcome
events fire in the feature hooks' own callbacks; `screen_viewed` fires from the root navigator.

**Tech Stack:** Expo SDK 57, Expo Router 57, HeroUI Native 1.0.10, Uniwind 1.12, TanStack Query
5, Zustand 5, plus two new packages: `expo-notifications` ~57.0.21 and
`expo-tracking-transparency` ~57.0.2. Tests for the core run on Node 24's built-in runner.

**Spec:** `docs/superpowers/specs/2026-09-30-permissions-analytics-design.md` (it extends
`docs/superpowers/specs/2026-09-28-forge-design.md`, "the base spec").
- Plans 0, A and B are on main. `@forge/contracts` is frozen and `apps/api` is not touched.
- Use the `heroui-native` skill (`.claude/skills/heroui-native`) for component APIs not shown
  here — docs only, never its install commands.

## Global Constraints

Copied verbatim from the spec (section in brackets). Every task's requirements include them.

- [§2] The app must keep running in Expo Go on the iOS Simulator and the Android emulator.
- [§2] `@forge/contracts` stays frozen and `apps/api` is not touched. Every choice in this spec is
  stored on the device (D40).
- [§2] **Approved dependency set** gains exactly two mobile packages, installed with
  `npx expo install` (user approval, 2026-09-30): `expo-notifications`,
  `expo-tracking-transparency`. Anything else: ask first.
- [§2] Base §7.7 UI rules apply to every new screen and row: default theme, tokens only, one
  primary action per screen, designed states, safe areas, accessibility labels.
- [§2] No personal data in events: never the email, display name, goal names typed by hand, or
  coach message text. The user id is attached only after consent (§5.2).
- [§5.2] Strict opt-in: `unknown` queues in memory (cap 100), `granted` flushes then sends,
  `denied` drops and ignores. The queue is never written to disk.
- [§3.2] The tracking step has one action only, which always shows the system alert (D39).
- [§4] `signOut()` resets the privacy store; `signIn()` does not.
- [base §7.7] Colour and spacing only through tokens. Anything that can't take a `className`
  gets its colour from theme hooks — never a literal.
- [base §10] **Gate before every commit:** `pnpm typecheck && pnpm lint && pnpm test`.

## Review Focus

Failure modes the spec implies but no step exercises by default, most likely first. Each is
pinned by a named step.

1. **"Not now" on analytics must silence everything.** After it, the Metro log shows no
   `[analytics]` line for the rest of the run, including the events queued before the answer.
   *Task 4, Step 6.*
2. **A second person on the same device.** After user A (analytics on) logs out, user B is
   asked again and B's events do not start until B agrees; nothing of A's choice carries over.
   *Task 4, Step 7.*
3. **An already-onboarded user upgrading.** With a signed-in, onboarded session from before this
   feature, the next launch shows the steps once, and a relaunch in the middle resumes at the
   first unanswered step instead of skipping to the tabs. *Task 2, Step 8.*
4. **A system answer that already exists.** When iOS already knows the answer, the step is
   skipped and the Settings row opens the system Settings app instead of asking. *Task 3, Step 4.*
5. **Double-tapping the primary button while the system alert is opening.** One request, one
   `permission_result`. *Task 2, Step 7.*

## Execution notes

Verified while this plan's code was built and checked (typecheck, lint, Prettier, the unit
tests and an iOS export) in a scratch copy of the repo on 2026-09-30. The permission dialogs
themselves were **not** run there; Task 1 settles them.

- **Toolchain.** Node 24 via nvm: run commands as
  `source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && <cmd>`. Prefix pnpm with
  `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` if corepack asks.
- **Commits.** Conventional Commits, one commit per task, never rewrite history, never push. End
  each commit message with the attribution trailer your harness specifies.
- **Decisions.** Tasks append the listed lines to `docs/decisions/plan-c.md`
  (`what · why · cost if wrong`), plus a line for any further non-obvious ruling.
- **This machine's API address.** The git-ignored `apps/api/.env` has `PORT=3001` and
  `apps/mobile/.env` has `EXPO_PUBLIC_API_URL=http://127.0.0.1:3001`: port 3000 and
  `[::1]:3001` are held by unrelated processes, so always use `127.0.0.1:3001`, never
  `localhost`. Leave the `.env.example` files alone.
- **Long-running processes** (`docker compose`, `pnpm dev:api`, Metro) may already be running,
  started by the user or the controller. Check before starting anything
  (`curl -s 127.0.0.1:3001/nope`, `lsof -nP -iTCP:8081 -sTCP:LISTEN`); never start a second
  copy and never stop one you did not start. Do not start Metro with `--localhost` (it then
  binds `[::1]` only and Expo Go cannot connect).
- **Expo Go after adding a native module or a route:** relaunch it
  (`xcrun simctl terminate booted host.exp.Exponent`, then
  `xcrun simctl openurl booted <the exp:// URL Metro printed>`); Fast Refresh does not pick up
  a changed route tree, and hot-editing `src/lib/query-client.ts` or a store creates a second
  instance until the app is relaunched.
- **Typing into the simulator.** The Mac's keyboard layout is non-Latin: put text on the
  pasteboard (`printf '%s' 'alex@forge.test' | xcrun simctl pbcopy booted`), long-press the
  field and choose Paste, and pause about a second before the next tap. Send one tap per
  round trip.
- **Screenshots** lag by one action: wait about 1.5 s after a tap. iOS may show "Save
  Password?" after sign-in: tap "Not Now". Dark: `xcrun simctl ui booted appearance dark`, and
  back to `light` afterwards.
- **Reading analytics.** Every delivered event is one Metro log line starting `[analytics]`;
  read the log of the Metro process that is serving the app.
- **Shell safety.** `.claude/settings.json` denies `rm -rf /*` and `rm -rf ~*`: use
  repo-relative paths.

## File structure

```
apps/mobile/
  app.json                         + expo-tracking-transparency (with its usage string), expo-notifications
  package.json                     + the two packages, + "test" script
  tsconfig.json                    + exclude for *.test.ts
  src/
    lib/analytics/
      events.ts                    the typed event map
      core.ts                      createAnalytics(sink): queue, consent gate, identity
      core.test.ts                 node:test unit tests
      mock-sink.ts                 console + in-memory buffer
      index.ts                     the app's singleton
    lib/permissions.ts             the only file that imports the Expo permission modules
    lib/session.ts                 signOut() also resets the privacy store
    stores/privacy-store.ts        analytics choice + promptsDone, persisted
    features/privacy/
      api.ts                       permission statuses through TanStack Query
      permission-step.tsx          one step's layout
      privacy-rows.tsx             the three Settings rows
    app/permissions.tsx            the steps
    app/_layout.tsx                guard, boot gate, identify, app_opened, screen_viewed
    app/(tabs)/settings.tsx        Privacy rows; logged_out; paywall source
    app/paywall.tsx                paywall_viewed, product_selected
    app/session/[id].tsx           session_opened
    features/{auth,me,plan,billing,coach}/api.ts   outcome events
    features/coach/{coach-chat,coach-teaser}.tsx   coach_message_sent, coach_teaser_viewed
apps/mobile/README.md · README.md · docs/decisions/plan-c.md · docs/screenshots/permissions-*.png, settings-privacy*.png
```

**Verification recipe used by every task.** From the repo root:
`pnpm --filter @forge/mobile typecheck && pnpm --filter @forge/mobile lint && pnpm --filter @forge/mobile test && (cd apps/mobile && npx expo export --platform ios --output-dir "$(mktemp -d)")`

Expected: no type errors, no ESLint problems, the unit tests pass, and `Exported: …`.

---

### Task 1: Dependencies, Expo Go feasibility, analytics core (TDD)

**Files:**
- Modify: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`
- Create (temporary, deleted in Step 4): `apps/mobile/src/app/(auth)/probe.tsx`
- Test: `apps/mobile/src/lib/analytics/core.test.ts`
- Create: `apps/mobile/src/lib/analytics/events.ts`, `core.ts`, `mock-sink.ts`, `index.ts`
- Create: `docs/decisions/plan-c.md`

**Interfaces:**
- Consumes: `@forge/contracts` types `ProductId`, `SessionId`, `SessionStatus`.
- Produces (later tasks use these exact names):
  - `analytics` from `@/lib/analytics`, with `track(name, ...props)`, `setConsent(choice)`,
    `identify(userId | null)`, `reset()`.
  - Types `PermissionKind`, `PermissionResult`, `PaywallSource` re-exported from
    `@/lib/analytics`.
  - `createAnalytics(sink, now?)`, `AnalyticsRecord`, `AnalyticsSink`, `ConsentChoice` from
    `./core`; `mockSink`, `getSentRecords()` from `./mock-sink`.
  - A written answer to the spec's four risks (§9) in `docs/decisions/plan-c.md`.

- [ ] **Step 1: Install the two approved packages**

Run from `apps/mobile`: `npx expo install expo-notifications expo-tracking-transparency`
Expected: both added to `package.json` (`~57.0.21`, `~57.0.2`); the CLI also adds
`"expo-tracking-transparency"` to `app.json`'s plugins.

- [ ] **Step 2: Configure the plugins**

In `apps/mobile/app.json`, make the end of the `plugins` array read (replace the bare
`"expo-tracking-transparency"` the CLI added):

```json
      [
        "expo-tracking-transparency",
        {
          "userTrackingPermission": "Forge uses this to measure which features help you train, across apps and websites."
        }
      ],
      "expo-notifications"
    ]
```

Run from `apps/mobile`: `npx expo config --type prebuild | grep -c expo-notifications`
Expected: a number above 0 and no error. (The strings only matter in a standalone build; Expo
Go shows its own.)

- [ ] **Step 3: Probe the system dialogs in Expo Go (spec §9, risks 1–3)**

Create the throwaway `apps/mobile/src/app/(auth)/probe.tsx`:

```tsx
import * as Notifications from 'expo-notifications';
import * as Tracking from 'expo-tracking-transparency';
import { Button, Typography } from 'heroui-native';
import { useState } from 'react';
import { View } from 'react-native';

// THROWAWAY: proves the two system dialogs appear in Expo Go. Deleted before the commit.
export default function Probe() {
  const [log, setLog] = useState('Tap a button.');
  const run = (label: string, call: () => Promise<unknown>) => async () => {
    try {
      setLog(`${label}: ${JSON.stringify(await call())}`);
    } catch (error) {
      setLog(`${label} threw: ${String(error)}`);
    }
  };
  return (
    <View className="flex-1 justify-center gap-3 bg-background px-6">
      <Button onPress={run('notifications status', () => Notifications.getPermissionsAsync())}>
        Notifications: status
      </Button>
      <Button onPress={run('notifications request', () => Notifications.requestPermissionsAsync())}>
        Notifications: request
      </Button>
      <Button onPress={run('tracking status', () => Tracking.getTrackingPermissionsAsync())}>
        Tracking: status
      </Button>
      <Button onPress={run('tracking request', () => Tracking.requestTrackingPermissionsAsync())}>
        Tracking: request
      </Button>
      <Typography type="body-sm" color="muted">
        {log}
      </Typography>
    </View>
  );
}
```

Relaunch Expo Go (Execution notes), sign out if a session exists, and open the probe:
`xcrun simctl openurl booted "<exp:// URL>/--/probe"`.

1. Tap "Notifications: status", then "Notifications: request". Expected: the iOS alert
   "“Expo Go” Would Like to Send You Notifications" appears; after answering, the line under
   the buttons shows `granted` and `status`.
2. Tap "Tracking: status", then "Tracking: request". Expected: the ATT alert appears with Expo
   Go's own text.
3. Find out how to make iOS ask again, and record the working recipe. Try, in this order:
   `xcrun simctl privacy booted reset all host.exp.Exponent`; then uninstalling Expo Go
   (`xcrun simctl uninstall booted host.exp.Exponent`) and letting the Expo CLI reinstall it
   (press `i` in the Metro terminal, or ask whoever owns Metro). Note which one resets which
   dialog.
4. Android (risk 3): if an emulator is available (`~/Library/Android/sdk/emulator/emulator
   -list-avds`; Expo Go 57 is already installed on `Pixel_9_Pro`), boot it, run
   `adb reverse tcp:3001 tcp:3001`, open the project
   (`adb shell am start -a android.intent.action.VIEW -d "<exp:// URL>/--/probe"`) and check
   the Metro log and the screen for an error from importing `expo-notifications`. Tap the
   notification buttons.

If a dialog does **not** appear on iOS, stop and report BLOCKED with what you saw: the spec's
permission steps depend on it.

If Android throws or logs an error on import, note it: Task 2's `permissions.ts` then uses the
lazy variant given in that task.

- [ ] **Step 4: Remove the probe**

Delete `apps/mobile/src/app/(auth)/probe.tsx`. `git status` must not list it.

- [ ] **Step 5: Write the failing test**

`apps/mobile/src/lib/analytics/core.test.ts`:

```ts
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
```

- [ ] **Step 6: Add the test script and keep the tests out of the app's typecheck**

`apps/mobile/package.json`, in `scripts`:

```json
    "test": "node --test \"src/**/*.test.ts\""
```

`apps/mobile/tsconfig.json` (the whole file):

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "exclude": ["node_modules", "babel.config.js", "metro.config.js", "**/*.test.ts"]
}
```

The tests run under Node's type stripping and import `node:test`; the app's TypeScript program
has no Node types, and adding them would put Node's globals into React Native code. ESLint
still covers the test file.

- [ ] **Step 7: Run the test to make sure it fails**

Run: `pnpm --filter @forge/mobile test`
Expected: FAIL — `Cannot find module '…/src/lib/analytics/core.ts'`.

- [ ] **Step 8: Write the event map and the core**

`apps/mobile/src/lib/analytics/events.ts`:

```ts
import type { ProductId, SessionId, SessionStatus } from '@forge/contracts';

export type PermissionKind = 'notifications' | 'analytics' | 'tracking';
export type PermissionResult = 'granted' | 'denied' | 'skipped';
export type PaywallSource = 'coach_teaser' | 'settings' | 'direct';

// Every event the app can send, with its properties. Ids, counts and codes only: never an
// email, a name or message text.
export interface AnalyticsEvents {
  app_opened: undefined;
  screen_viewed: { path: string };
  sign_up_completed: undefined;
  sign_in_completed: undefined;
  auth_failed: { flow: 'sign_up' | 'sign_in'; code: string };
  onboarding_completed: { goalCount: number };
  permission_prompt_viewed: { kind: PermissionKind };
  permission_result: { kind: PermissionKind; result: PermissionResult };
  session_opened: { sessionId: SessionId; status: SessionStatus };
  session_completed: { sessionId: SessionId; completedCount: number };
  plan_completed: undefined;
  plan_restarted: undefined;
  coach_teaser_viewed: undefined;
  paywall_viewed: { source: PaywallSource };
  product_selected: { productId: ProductId };
  trial_started: { productId: ProductId };
  purchase_failed: { code: string };
  restore_completed: { restored: boolean };
  coach_message_sent: { source: 'prompt' | 'typed' };
  coach_reply_received: undefined;
  coach_send_failed: { code: string };
  profile_updated: { goalCount: number };
  logged_out: undefined;
  account_deleted: undefined;
}

export type EventName = keyof AnalyticsEvents;

/** `track('app_opened')` takes no properties; `track('screen_viewed', { path })` requires them. */
export type PropsOf<E extends EventName> = AnalyticsEvents[E] extends undefined
  ? []
  : [props: AnalyticsEvents[E]];
```

`apps/mobile/src/lib/analytics/core.ts`:

```ts
import type { EventName, PropsOf } from './events';

export type ConsentChoice = 'unknown' | 'granted' | 'denied';

export interface AnalyticsRecord {
  name: EventName;
  props: Record<string, string | number | boolean>;
  timestamp: string;
  userId: string | null;
}

export interface AnalyticsSink {
  send(record: AnalyticsRecord): void;
}

export interface Analytics {
  track<E extends EventName>(name: E, ...props: PropsOf<E>): void;
  setConsent(choice: ConsentChoice): void;
  identify(userId: string | null): void;
  reset(): void;
}

const QUEUE_LIMIT = 100;

type QueuedRecord = Omit<AnalyticsRecord, 'userId'>;

/**
 * Strict opt-in. Until the person chooses, events wait in memory; "yes" sends them in order,
 * "no" drops them, and nothing is ever written to disk. No React Native imports, so the rules
 * are unit-tested with plain Node.
 */
export function createAnalytics(
  sink: AnalyticsSink,
  now: () => Date = () => new Date(),
): Analytics {
  let consent: ConsentChoice = 'unknown';
  let userId: string | null = null;
  let queue: QueuedRecord[] = [];

  return {
    track(name, ...props) {
      if (consent === 'denied') return;
      const record: QueuedRecord = { name, props: props[0] ?? {}, timestamp: now().toISOString() };
      if (consent === 'granted') {
        sink.send({ ...record, userId });
        return;
      }
      queue.push(record);
      if (queue.length > QUEUE_LIMIT) queue.shift();
    },

    setConsent(choice) {
      consent = choice;
      if (choice === 'unknown') return;
      // The id is stamped at send time: a queued event belongs to whoever agreed to share it.
      if (choice === 'granted') for (const record of queue) sink.send({ ...record, userId });
      queue = [];
    },

    identify(id) {
      userId = id;
    },

    reset() {
      consent = 'unknown';
      userId = null;
      queue = [];
    },
  };
}
```

- [ ] **Step 9: Run the test to make sure it passes**

Run: `pnpm --filter @forge/mobile test`
Expected: PASS — `tests 8`, `pass 8`, `fail 0`.

- [ ] **Step 10: Mock sink and the app's singleton**

`apps/mobile/src/lib/analytics/mock-sink.ts`:

```ts
import type { AnalyticsRecord, AnalyticsSink } from './core';

const BUFFER_LIMIT = 200;
const sent: AnalyticsRecord[] = [];

/** Stands in for a real SDK: one console line per event, and the last 200 kept in memory. */
export const mockSink: AnalyticsSink = {
  send(record) {
    sent.push(record);
    if (sent.length > BUFFER_LIMIT) sent.shift();
    console.log(`[analytics] ${record.name} ${JSON.stringify(record.props)}`);
  },
};

export function getSentRecords(): readonly AnalyticsRecord[] {
  return sent;
}
```

`apps/mobile/src/lib/analytics/index.ts`:

```ts
import { createAnalytics } from './core';
import { mockSink } from './mock-sink';

/** The app's one analytics instance. Swap `mockSink` for a real SDK's sink to go live. */
export const analytics = createAnalytics(mockSink);

export type { PaywallSource, PermissionKind, PermissionResult } from './events';
```

- [ ] **Step 11: Verify (recipe), record decisions, commit**

Run the verification recipe. Expected: clean, 8 tests.
Run: `pnpm typecheck && pnpm lint && pnpm test`. Expected: all green (API 78 tests, contracts
3, mobile 8).

Create `docs/decisions/plan-c.md`:

```markdown
# Plan C — decisions (what · why · cost if wrong)

- The analytics core imports nothing from React Native and is tested with `node --test` · Node 24 runs the TypeScript directly, so the consent rules get real tests with no test framework added · the test file is outside the app's `tsc` program (ESLint still checks it)
- `*.test.ts` is excluded in `apps/mobile/tsconfig.json` · the tests import `node:test`, and Node's types in the app program would put Node globals into React Native code · a type error in a test shows up when the test runs, not in `pnpm typecheck`
- The queue stamps the user id when an event is sent, not when it is tracked · a queued event belongs to whoever agreed to share it · none
```

Append one line per finding from Step 3, in the same format: whether each dialog appeared in
Expo Go, the recipe that makes iOS ask again, and what Android did on import.

```bash
git add apps/mobile pnpm-lock.yaml docs/decisions/plan-c.md
git commit -m "feat(mobile): analytics core with a mock sink and a consent gate"
```

---

### Task 2: Privacy store, permission access, the permission steps

**Files:**
- Create: `apps/mobile/src/stores/privacy-store.ts`, `apps/mobile/src/lib/permissions.ts`
- Create: `apps/mobile/src/features/privacy/api.ts`, `permission-step.tsx`
- Create: `apps/mobile/src/app/permissions.tsx`
- Modify: `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/lib/session.ts`

**Interfaces:**
- Consumes:
  - Task 1: `analytics`, `PermissionKind`.
  - Plan B: `queryClient`, `useMe`, `useSession`, `useSessionHydrated`, `SubmitButton`, `Icon`,
    `IconName`.
- Produces:
  - `usePrivacy { analytics; promptsDone; setAnalytics(choice); setPromptsDone(); reset() }`,
    `usePrivacyHydrated()`, type `AnalyticsChoice`.
  - `PermissionStatus`, `getNotificationStatus()`, `requestNotifications()`,
    `getTrackingStatus()`, `requestTracking()`, `openSystemSettings()`.
  - `permissionKeys`, `useNotificationStatus()`, `useTrackingStatus()`.
  - `PermissionStep`, `PermissionStepContent`.
  - The `permissions` route and its guard; `app_opened`, `screen_viewed`,
    `permission_prompt_viewed` and `permission_result` events.

- [ ] **Step 1: Privacy store**

`apps/mobile/src/stores/privacy-store.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { analytics } from '@/lib/analytics';

export type AnalyticsChoice = 'unknown' | 'granted' | 'denied';

interface PrivacyState {
  analytics: AnalyticsChoice;
  /** The permission steps after onboarding have been walked through on this device. */
  promptsDone: boolean;
  setAnalytics: (choice: 'granted' | 'denied') => void;
  setPromptsDone: () => void;
  reset: () => void;
}

// A failed read counts as "nothing stored": zustand's persist never finishes hydrating on a
// rejection, and the splash waits for it.
const storage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name).catch(() => null),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

// The person's privacy choices. Device-only (the API has no place for them) and reset on
// sign-out, like the rest of that person's data. Every change is pushed into the analytics
// service, which is what actually gates the events.
export const usePrivacy = create<PrivacyState>()(
  persist(
    (set) => ({
      analytics: 'unknown',
      promptsDone: false,
      setAnalytics: (choice) => {
        set({ analytics: choice });
        analytics.setConsent(choice);
      },
      setPromptsDone: () => set({ promptsDone: true }),
      reset: () => {
        set({ analytics: 'unknown', promptsDone: false });
        analytics.reset();
      },
    }),
    {
      name: 'forge.privacy',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ analytics: state.analytics, promptsDone: state.promptsDone }),
      onRehydrateStorage: () => (state) => {
        if (state) analytics.setConsent(state.analytics);
      },
    },
  ),
);

/** True once the choices have been read back from AsyncStorage on launch. */
export function usePrivacyHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => usePrivacy.persist.onFinishHydration(onChange),
    () => usePrivacy.persist.hasHydrated(),
  );
}
```

- [ ] **Step 2: Permission access**

`apps/mobile/src/lib/permissions.ts`:

```ts
import * as Notifications from 'expo-notifications';
import * as Tracking from 'expo-tracking-transparency';
import { Linking, Platform } from 'react-native';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'unavailable';

// The only file that touches the Expo permission modules. Anything they cannot do where the app
// is running (Expo Go gaps, Android having no ATT) comes back as `unavailable`.

function toStatus(response: { granted: boolean; status: string }): PermissionStatus {
  if (response.granted) return 'granted';
  return response.status === 'undetermined' ? 'undetermined' : 'denied';
}

export async function getNotificationStatus(): Promise<PermissionStatus> {
  try {
    return toStatus(await Notifications.getPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function requestNotifications(): Promise<PermissionStatus> {
  try {
    return toStatus(await Notifications.requestPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function getTrackingStatus(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    return toStatus(await Tracking.getTrackingPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function requestTracking(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    return toStatus(await Tracking.requestTrackingPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export function openSystemSettings(): Promise<void> {
  return Linking.openSettings();
}
```

Only if Task 1's Android probe showed an error on import (see `docs/decisions/plan-c.md`),
replace the static `expo-notifications` import with this loader and use
`loadNotifications()?.getPermissionsAsync()` / `requestPermissionsAsync()`, returning
`'unavailable'` when it is `null`; add a decisions line saying so:

```ts
type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

// Loaded on first use: importing it at module load logs an error in Expo Go on Android.
function loadNotifications(): NotificationsModule | null {
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy load
      cached = require('expo-notifications') as NotificationsModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}
```

- [ ] **Step 3: Permission statuses as queries**

`apps/mobile/src/features/privacy/api.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { getNotificationStatus, getTrackingStatus, type PermissionStatus } from '@/lib/permissions';

export const permissionKeys = {
  notifications: ['permission', 'notifications'],
  tracking: ['permission', 'tracking'],
} as const;

// System permission statuses, read through TanStack Query so that coming back from the iOS
// Settings app refetches them with everything else (the focus wiring in query-client.ts).
export function useNotificationStatus() {
  return useQuery<PermissionStatus>({
    queryKey: permissionKeys.notifications,
    queryFn: getNotificationStatus,
  });
}

export function useTrackingStatus() {
  return useQuery<PermissionStatus>({
    queryKey: permissionKeys.tracking,
    queryFn: getTrackingStatus,
  });
}
```

- [ ] **Step 4: The step layout**

`apps/mobile/src/features/privacy/permission-step.tsx`:

```tsx
import { Button, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { SubmitButton } from '@/components/submit-button';

export interface PermissionStepContent {
  icon: IconName;
  title: string;
  body: string;
  reasons: { icon: IconName; text: string }[];
  primaryLabel: string;
  /** Absent on the tracking step: a screen shown before the ATT alert may offer one action only. */
  secondaryLabel?: string;
}

interface PermissionStepProps extends PermissionStepContent {
  progress: string;
  isPending: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}

/** One permission ask: what it is, why, and the choice. The same layout for every step. */
export function PermissionStep({
  icon,
  title,
  body,
  reasons,
  primaryLabel,
  secondaryLabel,
  progress,
  isPending,
  onPrimary,
  onSecondary,
}: PermissionStepProps) {
  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow justify-center gap-8 px-6 pb-6 pt-safe-offset-6">
        <View className="items-center gap-4">
          <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
            {progress}
          </Typography>
          <View className="size-16 items-center justify-center rounded-full bg-accent-soft">
            <Icon name={icon} size={30} className="text-accent-soft-foreground" />
          </View>
          <View className="items-center gap-2">
            <Typography.Heading type="h3" align="center">
              {title}
            </Typography.Heading>
            <Typography type="body" color="muted" align="center">
              {body}
            </Typography>
          </View>
        </View>
        <View className="gap-3">
          {reasons.map((reason) => (
            <View key={reason.text} className="flex-row items-center gap-3">
              <Icon name={reason.icon} size={20} className="text-accent" />
              <Typography type="body-sm" className="flex-1">
                {reason.text}
              </Typography>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="gap-3 px-6 pb-safe-offset-4 pt-3">
        <SubmitButton label={primaryLabel} isPending={isPending} onPress={onPrimary} />
        {secondaryLabel ? (
          <Button variant="tertiary" isDisabled={isPending} onPress={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
```

- [ ] **Step 5: The permissions screen**

`apps/mobile/src/app/permissions.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { permissionKeys, useNotificationStatus, useTrackingStatus } from '@/features/privacy/api';
import { PermissionStep, type PermissionStepContent } from '@/features/privacy/permission-step';
import { analytics, type PermissionKind } from '@/lib/analytics';
import { requestNotifications, requestTracking } from '@/lib/permissions';
import { queryClient } from '@/lib/query-client';
import { usePrivacy } from '@/stores/privacy-store';

const STEPS: Record<PermissionKind, PermissionStepContent> = {
  notifications: {
    icon: 'notifications-outline',
    title: 'Stay on track',
    body: 'Get a nudge when your next session is ready. Only about your plan, never marketing.',
    reasons: [{ icon: 'settings-outline', text: 'Change it any time in Settings' }],
    primaryLabel: 'Turn on notifications',
    secondaryLabel: 'Not now',
  },
  analytics: {
    icon: 'analytics-outline',
    title: 'Help improve Forge',
    body: 'Share which screens you open and when you finish a session. Never your name, email or coach messages.',
    reasons: [
      { icon: 'bar-chart-outline', text: 'Used only to see what helps people train' },
      { icon: 'settings-outline', text: 'Switch it off any time in Settings' },
    ],
    primaryLabel: 'Share usage data',
    secondaryLabel: 'Not now',
  },
  tracking: {
    icon: 'link-outline',
    title: 'One more choice',
    body: 'iOS will ask whether Forge may link your activity with other apps and websites. Forge works the same either way.',
    reasons: [{ icon: 'settings-outline', text: 'Change it any time in iOS Settings' }],
    primaryLabel: 'Continue',
  },
};

export default function PermissionsScreen() {
  const notifications = useNotificationStatus();
  const tracking = useTrackingStatus();
  const analyticsChoice = usePrivacy((state) => state.analytics);
  // Steps answered during this visit, "Not now" included: those are not asked twice.
  const [answered, setAnswered] = useState<PermissionKind[]>([]);
  const [isPending, setIsPending] = useState(false);

  const loaded = notifications.data !== undefined && tracking.data !== undefined;
  const upcoming: PermissionKind[] = [];
  if (loaded) {
    if (notifications.data === 'undetermined' && !answered.includes('notifications')) {
      upcoming.push('notifications');
    }
    if (analyticsChoice === 'unknown') upcoming.push('analytics');
    // Tracking is only worth asking once analytics is on; it stays in the count until then.
    if (
      Platform.OS === 'ios' &&
      tracking.data === 'undetermined' &&
      analyticsChoice !== 'denied' &&
      !answered.includes('tracking')
    ) {
      upcoming.push('tracking');
    }
  }
  const step = upcoming[0];
  const finished = loaded && step === undefined;

  useEffect(() => {
    if (finished) usePrivacy.getState().setPromptsDone();
  }, [finished]);

  useEffect(() => {
    if (step) analytics.track('permission_prompt_viewed', { kind: step });
  }, [step]);

  // Nothing to show while the statuses load or once the last step is answered: the background
  // holds for the frame or two before the step appears or the guard moves on.
  if (!step) return <View className="flex-1 bg-background" />;

  const answer = (kind: PermissionKind) => setAnswered((current) => [...current, kind]);

  const allow = async () => {
    if (step === 'analytics') {
      usePrivacy.getState().setAnalytics('granted');
      analytics.track('permission_result', { kind: 'analytics', result: 'granted' });
      answer('analytics');
      return;
    }
    setIsPending(true);
    try {
      const status =
        step === 'notifications' ? await requestNotifications() : await requestTracking();
      queryClient.setQueryData(permissionKeys[step], status);
      analytics.track('permission_result', {
        kind: step,
        result: status === 'granted' ? 'granted' : 'denied',
      });
      answer(step);
    } finally {
      setIsPending(false);
    }
  };

  const notNow = () => {
    if (step === 'analytics') {
      // A "no" is never reported: reporting it would itself be tracking.
      usePrivacy.getState().setAnalytics('denied');
    } else {
      analytics.track('permission_result', { kind: step, result: 'skipped' });
    }
    answer(step);
  };

  return (
    <PermissionStep
      {...STEPS[step]}
      progress={`Step ${answered.length + 1} of ${answered.length + upcoming.length}`}
      isPending={isPending}
      onPrimary={() => void allow()}
      onSecondary={notNow}
    />
  );
}
```

- [ ] **Step 6: Guard, boot gate and the root-level events; sign-out reset**

`apps/mobile/src/app/_layout.tsx`:

```diff
@@ -3,7 +3,7 @@
 
 import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
 import { useIsRestoring } from '@tanstack/react-query';
-import { Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
+import { Stack, ThemeProvider, usePathname, type ErrorBoundaryProps } from 'expo-router';
 import * as SplashScreen from 'expo-splash-screen';
 import { StatusBar } from 'expo-status-bar';
 import { HeroUINativeProvider } from 'heroui-native';
@@ -14,8 +14,10 @@
 import { NoticeToaster } from '@/components/notice-toaster';
 import { ScreenState } from '@/components/screen-state';
 import { useMe } from '@/features/me/api';
+import { analytics } from '@/lib/analytics';
 import { useNavigationTheme } from '@/lib/navigation-theme';
 import { persistOptions, queryClient } from '@/lib/query-client';
+import { usePrivacy, usePrivacyHydrated } from '@/stores/privacy-store';
 import { useSession, useSessionHydrated } from '@/stores/session-store';
 
 void SplashScreen.preventAutoHideAsync();
@@ -66,20 +68,38 @@
 function RootNavigator() {
   const navigationTheme = useNavigationTheme();
   const sessionHydrated = useSessionHydrated();
+  const privacyHydrated = usePrivacyHydrated();
   const restoringCache = useIsRestoring();
   const signedIn = useSession((state) => state.token !== null);
+  const promptsDone = usePrivacy((state) => state.promptsDone);
   const me = useMe();
+  const pathname = usePathname();
+  const userId = me.data?.id ?? null;
 
-  // The splash stays up until we know which stack to show: token read, cache restored, and
+  // The splash stays up until we know which stack to show: token and privacy choices read,
+  // cache restored, and
   // (for a signed-in user without a cached profile) the first GET /me settled. A retry after
   // that first failure keeps the error screen up instead of returning to a blank window.
   const ready =
-    sessionHydrated && !restoringCache && !(signedIn && me.isPending && me.errorUpdateCount === 0);
+    sessionHydrated &&
+    privacyHydrated &&
+    !restoringCache &&
+    !(signedIn && me.isPending && me.errorUpdateCount === 0);
 
   useEffect(() => {
-    if (ready) void SplashScreen.hideAsync();
+    if (!ready) return;
+    void SplashScreen.hideAsync();
+    analytics.track('app_opened');
   }, [ready]);
 
+  useEffect(() => {
+    analytics.identify(userId);
+  }, [userId]);
+
+  useEffect(() => {
+    if (ready) analytics.track('screen_viewed', { path: pathname });
+  }, [ready, pathname]);
+
   if (!ready) return null;
 
   if (signedIn && !me.data) {
@@ -105,7 +125,10 @@
         <Stack.Protected guard={signedIn && !onboarded}>
           <Stack.Screen name="onboarding" />
         </Stack.Protected>
-        <Stack.Protected guard={signedIn && onboarded}>
+        <Stack.Protected guard={signedIn && onboarded && !promptsDone}>
+          <Stack.Screen name="permissions" />
+        </Stack.Protected>
+        <Stack.Protected guard={signedIn && onboarded && promptsDone}>
           <Stack.Screen name="(tabs)" />
           <Stack.Screen
             name="session/[id]"
```

`apps/mobile/src/lib/session.ts`:

```diff
@@ -1,6 +1,7 @@
 import type { AuthResponse } from '@forge/contracts';
 import { usePlanCelebration } from '@/stores/celebration-store';
 import { useChecklist } from '@/stores/checklist-store';
+import { usePrivacy } from '@/stores/privacy-store';
 import { useSession } from '@/stores/session-store';
 import { setUnauthorizedHandler } from './api';
 import { publishNotice } from './notices';
@@ -29,6 +30,9 @@
   // Token first: the route guards leave the signed-in screens before their data disappears.
   useSession.getState().setToken(null);
   await clearUserData();
+  // Privacy choices go with the person. Not on sign-in: the events queued before and during
+  // sign-up must survive until that person answers the analytics step.
+  usePrivacy.getState().reset();
   if (reason) publishNotice(SIGN_OUT_NOTICES[reason]);
 }
 
```

Run the verification recipe. Expected: clean.

- [ ] **Step 7: Self-check the steps (keeps the screenshots)**

Run `mobile-self-check`. Reset Expo Go's permission answers first (Task 1's recipe), relaunch
Expo Go, and sign up a new user through onboarding. Capture into `docs/screenshots/`:

- `permissions-notifications.png` and `permissions-notifications-dark.png`: "Step 1 of 3",
  "Stay on track", the body, "Turn on notifications" and "Not now".
- Tap "Turn on notifications": the iOS alert appears; the button shows its pending state while
  it is open. Answer it.
- `permissions-analytics.png`: "Step 2 of 3", "Help improve Forge", "Share usage data" and
  "Not now". Tap "Share usage data".
- `permissions-tracking.png`: "Step 3 of 3", "One more choice", a single "Continue". Tap it:
  the ATT alert appears. Answer it: the app lands on the Plan tab.

**Review Focus #5:** on the notifications step, tap the primary button twice as fast as the
tool allows. Expected: one system alert, and later one `permission_result` line for
`notifications` in the Metro log.

Check the Metro log. With analytics granted, the queued events appear at the moment of
"Share usage data", in order, ending with lines like:

```
[analytics] permission_prompt_viewed {"kind":"analytics"}
[analytics] permission_result {"kind":"analytics","result":"granted"}
[analytics] permission_prompt_viewed {"kind":"tracking"}
[analytics] permission_result {"kind":"tracking","result":"granted"}
[analytics] screen_viewed {"path":"/"}
```

(`result` for tracking is whatever you answered.)

- [ ] **Step 8: Self-check the other paths**

1. **"Not now" twice:** a fresh user, "Not now" on notifications (no system alert), "Not now"
   on analytics. Expected: no tracking step, the Plan tab, and no `[analytics]` line from that
   user's run.
2. **Review Focus #3, upgrading user:** with a signed-in, onboarded user on the Plan tab, clear
   only the privacy choices to imitate a session from before this feature — add a temporary
   line `usePrivacy.getState().reset()` at module level in `_layout.tsx`, relaunch Expo Go,
   remove the line, relaunch again. Expected: the steps show once; system steps whose answer
   iOS already knows are skipped and the count adjusts ("Step 1 of 1" when only analytics is
   left). Then, part-way through a multi-step run, relaunch Expo Go: it resumes at the first
   unanswered step, not at the tabs. `git diff` must show no leftover temporary line.
3. **Log out and back in:** Settings → Log out → sign in again. Expected: the analytics step is
   asked again ("Step 1 of 1" or "1 of 2"), the system steps are skipped.

Delete the test accounts (`curl -X DELETE http://127.0.0.1:3001/me -H "authorization: Bearer
<token>"`) and leave the simulator in light.

- [ ] **Step 9: Record decisions and commit**

Append to `docs/decisions/plan-c.md`:

```markdown
- The privacy store reads AsyncStorage through a wrapper that turns a failed read into "nothing stored" · zustand's persist never finishes hydrating on a rejection and the splash waits for it (the SecureStore lesson from Plan B) · none
- The permissions screen derives its step from the statuses and the choices instead of storing a step index · answers can come from the system, the store or a relaunch, and a derived step cannot disagree with them · the progress count is recomputed, so it can shrink when analytics is declined
- "Not now" on notifications does not call the system request · iOS asks once, so the real prompt is kept for the Settings row · the status stays "Not set" until then
```

```bash
git add apps/mobile docs/screenshots docs/decisions/plan-c.md
git commit -m "feat(mobile): permission steps after onboarding"
```

---

### Task 3: Settings — the privacy rows

**Files:**
- Create: `apps/mobile/src/features/privacy/privacy-rows.tsx`
- Modify: `apps/mobile/src/app/(tabs)/settings.tsx`

**Interfaces:**
- Consumes:
  - Task 1: `analytics`, `PermissionKind`.
  - Task 2: `usePrivacy`, `permissionKeys`, `useNotificationStatus`, `useTrackingStatus`,
    `requestNotifications`, `requestTracking`, `openSystemSettings`, `PermissionStatus`.
- Produces: `NotificationsRow`, `TrackingRow` (iOS only), `AnalyticsRow`.

- [ ] **Step 1: The rows**

`apps/mobile/src/features/privacy/privacy-rows.tsx`:

```tsx
import { ListGroup, SkeletonGroup, Switch } from 'heroui-native';
import { useState } from 'react';
import { analytics, type PermissionKind } from '@/lib/analytics';
import {
  openSystemSettings,
  requestNotifications,
  requestTracking,
  type PermissionStatus,
} from '@/lib/permissions';
import { queryClient } from '@/lib/query-client';
import { usePrivacy } from '@/stores/privacy-store';
import { permissionKeys, useNotificationStatus, useTrackingStatus } from './api';

const NOTIFICATION_LABELS: Record<PermissionStatus, string> = {
  granted: 'On',
  denied: 'Off',
  undetermined: 'Not set',
  unavailable: 'Unavailable',
};

const TRACKING_LABELS: Record<PermissionStatus, string> = {
  granted: 'Allowed',
  denied: 'Not allowed',
  undetermined: 'Not set',
  unavailable: 'Unavailable',
};

export function NotificationsRow() {
  const status = useNotificationStatus();
  return (
    <SystemPermissionRow
      kind="notifications"
      title="Notifications"
      status={status.data}
      labels={NOTIFICATION_LABELS}
      request={requestNotifications}
    />
  );
}

/** iOS only: render it behind a `Platform.OS === 'ios'` check. */
export function TrackingRow() {
  const status = useTrackingStatus();
  return (
    <SystemPermissionRow
      kind="tracking"
      title="Tracking"
      status={status.data}
      labels={TRACKING_LABELS}
      request={requestTracking}
    />
  );
}

interface SystemPermissionRowProps {
  kind: Exclude<PermissionKind, 'analytics'>;
  title: string;
  status: PermissionStatus | undefined;
  labels: Record<PermissionStatus, string>;
  request: () => Promise<PermissionStatus>;
}

// iOS asks once. While the answer is still open the row asks; after that only the system
// Settings app can change it, so the row opens that instead.
function SystemPermissionRow({ kind, title, status, labels, request }: SystemPermissionRowProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  // Until the status is known the row shows a skeleton, never a guessed value.
  if (status === undefined) {
    return (
      <ListGroup.Item accessible accessibilityLabel={`Checking ${title.toLowerCase()}`}>
        <ListGroup.ItemContent>
          <SkeletonGroup isLoading isSkeletonOnly className="gap-2">
            <SkeletonGroup.Item className="h-5 w-1/3 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-1/4 rounded-md" />
          </SkeletonGroup>
        </ListGroup.ItemContent>
      </ListGroup.Item>
    );
  }

  if (status === 'unavailable') {
    return (
      <ListGroup.Item>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>{labels.unavailable}</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
      </ListGroup.Item>
    );
  }

  const onPress = async () => {
    if (status !== 'undetermined') {
      await openSystemSettings();
      return;
    }
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await request();
      queryClient.setQueryData(permissionKeys[kind], result);
      analytics.track('permission_result', {
        kind,
        result: result === 'granted' ? 'granted' : 'denied',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <ListGroup.Item accessibilityRole="button" onPress={() => void onPress()}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>{labels[status]}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  );
}

export function AnalyticsRow() {
  const isOn = usePrivacy((state) => state.analytics === 'granted');

  const toggle = (next: boolean) => {
    usePrivacy.getState().setAnalytics(next ? 'granted' : 'denied');
    // Only a "yes" is reported: once it is off, nothing is sent, including the fact it is off.
    if (next) analytics.track('permission_result', { kind: 'analytics', result: 'granted' });
  };

  return (
    <ListGroup.Item>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>Usage analytics</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>
          {isOn ? 'Sharing screens opened and sessions finished' : 'Off'}
        </ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={isOn} onSelectedChange={toggle} accessibilityLabel="Usage analytics" />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}
```

- [ ] **Step 2: Add them to Settings**

`apps/mobile/src/app/(tabs)/settings.tsx`:

```diff
@@ -1,11 +1,12 @@
 import { router } from 'expo-router';
 import { Avatar, ListGroup, Separator, SkeletonGroup, Typography } from 'heroui-native';
 import { useState } from 'react';
-import { ScrollView, View } from 'react-native';
+import { Platform, ScrollView, View } from 'react-native';
 import { Icon } from '@/components/icon';
 import { GOAL_LABELS } from '@/content/labels';
 import { useEntitlement } from '@/features/billing/api';
 import { useMe } from '@/features/me/api';
+import { AnalyticsRow, NotificationsRow, TrackingRow } from '@/features/privacy/privacy-rows';
 import { DeleteAccountDialog } from '@/features/settings/delete-account-dialog';
 import { SettingsSkeleton } from '@/features/settings/settings-skeleton';
 import { APP_VERSION } from '@/lib/config';
@@ -81,6 +82,16 @@
                 <Icon name="shield-checkmark-outline" size={20} className="text-muted" />
               </ListGroup.ItemSuffix>
             </ListGroup.Item>
+            <Separator className="mx-4" />
+            <NotificationsRow />
+            {Platform.OS === 'ios' ? (
+              <>
+                <Separator className="mx-4" />
+                <TrackingRow />
+              </>
+            ) : null}
+            <Separator className="mx-4" />
+            <AnalyticsRow />
           </ListGroup>
         </Section>
 
```

- [ ] **Step 3: Verify (recipe), then self-check**

Run the verification recipe. Expected: clean.

Run `mobile-self-check` with an onboarded user who allowed notifications and analytics.
Capture `settings-privacy.png` and `settings-privacy-dark.png` (scroll so the Privacy group is
fully visible): "Data consent", "Notifications — On", "Tracking — Allowed / Not allowed",
"Usage analytics" with its switch on.

- Toggle "Usage analytics" off: the description reads "Off" and no further `[analytics]` line
  appears while you move between tabs. Toggle it on: one
  `permission_result {"kind":"analytics","result":"granted"}` line, then `screen_viewed` lines
  again.
- The switch in the simulator responds to a short horizontal drag across the knob, not always
  to a tap.

- [ ] **Step 4: Review Focus #4 — answers iOS already has**

1. With notifications already answered, tap the Notifications row. Expected: the system
   Settings app opens (Expo Go's page); come back: the row is unchanged.
2. Reset Expo Go's permission answers (Task 1's recipe), sign in, answer "Not now" on the
   notifications step, open Settings: the row reads "Not set". Tap it: the iOS alert appears;
   after "Allow" the row reads "On" and the log shows
   `permission_result {"kind":"notifications","result":"granted"}` (if analytics is on).
3. While a status is loading the row shows a skeleton line, never a value (hard to catch by
   eye; confirm it from the code path `status === undefined`).

- [ ] **Step 5: Commit**

Append to `docs/decisions/plan-c.md`:

```markdown
- A Settings permission row asks only while iOS has no answer, and opens the system Settings app afterwards · iOS shows each permission alert once per app · a second tap on a denied permission leaves the app
- Turning analytics off in Settings is not reported · once it is off nothing is sent, including the fact that it is off · the funnel cannot count opt-outs
```

```bash
git add apps/mobile docs/screenshots docs/decisions/plan-c.md
git commit -m "feat(mobile): privacy rows in settings"
```

---

### Task 4: Funnel events across the app

**Files:**
- Modify: `apps/mobile/src/features/auth/api.ts`, `features/me/api.ts`, `features/plan/api.ts`,
  `features/billing/api.ts`, `features/coach/api.ts`
- Modify: `apps/mobile/src/features/coach/coach-chat.tsx`, `features/coach/coach-teaser.tsx`
- Modify: `apps/mobile/src/app/paywall.tsx`, `app/session/[id].tsx`, `app/(tabs)/settings.tsx`

**Interfaces:**
- Consumes: Task 1's `analytics` and `PaywallSource`.
- Produces: every event in spec §6 that Tasks 2–3 did not already fire.

- [ ] **Step 1: Outcome events in the feature hooks**

Each file below is shown whole. Outcome events sit in the hooks' own callbacks (D44): a
`mutate()` call's callbacks are skipped once the calling screen has unmounted.

`apps/mobile/src/features/auth/api.ts`:

```ts
import {
  authResponseSchema,
  routes,
  type AuthResponse,
  type LoginBody,
  type SignupBody,
} from '@forge/contracts';
import { useMutation } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { signIn } from '@/lib/session';

export function useSignIn() {
  return useMutation<AuthResponse, ApiError, LoginBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.login, authResponseSchema, body),
    onSuccess: (auth) => {
      analytics.track('sign_in_completed');
      return signIn(auth);
    },
    onError: (error) => analytics.track('auth_failed', { flow: 'sign_in', code: error.code }),
  });
}

export function useSignUp() {
  return useMutation<AuthResponse, ApiError, SignupBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.signup, authResponseSchema, body),
    onSuccess: (auth) => {
      analytics.track('sign_up_completed');
      return signIn(auth);
    },
    onError: (error) => analytics.track('auth_failed', { flow: 'sign_up', code: error.code }),
  });
}
```

`apps/mobile/src/features/me/api.ts`:

```ts
import { routes, userSchema, type UpdateMeBody, type User } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, apiRequestNoContent, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { signOut } from '@/lib/session';
import { useSession } from '@/stores/session-store';

export function useMe() {
  const token = useSession((state) => state.token);
  return useQuery<User, ApiError>({
    queryKey: queryKeys.me,
    queryFn: () => apiRequest('GET', routes.me, userSchema),
    enabled: token !== null,
  });
}

export function useUpdateMe() {
  return useMutation<User, ApiError, UpdateMeBody>({
    mutationFn: (body) => apiRequest('PATCH', routes.me, userSchema, body),
    onSuccess: (user, body) => {
      queryClient.setQueryData(queryKeys.me, user);
      // Only the onboarding form sends the consent; the edit-profile form never does.
      analytics.track(body.acceptConsent ? 'onboarding_completed' : 'profile_updated', {
        goalCount: user.goals.length,
      });
    },
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiRequestNoContent('DELETE', routes.me),
    onSuccess: () => {
      // Tracked before the sign-out resets the consent, so a consenting user's last event lands.
      analytics.track('account_deleted');
      return signOut('deleted');
    },
  });
}
```

`apps/mobile/src/features/plan/api.ts`:

```ts
import { planViewSchema, routes, type PlanView, type SessionId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useChecklist } from '@/stores/checklist-store';
import { useSession } from '@/stores/session-store';

export function usePlan() {
  const token = useSession((state) => state.token);
  return useQuery<PlanView, ApiError>({
    queryKey: queryKeys.plan,
    queryFn: () => apiRequest('GET', routes.plan.get, planViewSchema),
    enabled: token !== null,
  });
}

// The server decides what unlocks; its answer replaces the cached plan. The checklist ticks are
// cleared here, at hook level, because TanStack skips a `mutate()` call's own callbacks once the
// calling screen has unmounted (the user backed out during a slow request), which would leave
// the completed session pre-ticked for the next run of the plan.
export function useCompleteSession() {
  return useMutation<PlanView, ApiError, SessionId>({
    mutationFn: (sessionId) => apiRequest('POST', routes.plan.complete(sessionId), planViewSchema),
    onSuccess: (plan, sessionId) => {
      queryClient.setQueryData(queryKeys.plan, plan);
      useChecklist.getState().clear(sessionId);
      analytics.track('session_completed', { sessionId, completedCount: plan.completedCount });
      if (plan.nextSessionId === null) analytics.track('plan_completed');
    },
  });
}

// A restart starts every session from a blank checklist, including one whose completion the
// client never saw succeed (a timed-out request the server still applied).
export function useResetPlan() {
  return useMutation<PlanView, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.plan.reset, planViewSchema),
    onSuccess: (plan) => {
      queryClient.setQueryData(queryKeys.plan, plan);
      useChecklist.getState().reset();
      analytics.track('plan_restarted');
    },
  });
}
```

`apps/mobile/src/features/billing/api.ts`:

```ts
import { entitlementSchema, routes, type Entitlement, type ProductId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useSession } from '@/stores/session-store';

export function useEntitlement() {
  const token = useSession((state) => state.token);
  return useQuery<Entitlement, ApiError>({
    queryKey: queryKeys.entitlement,
    queryFn: () => apiRequest('GET', routes.billing.entitlement, entitlementSchema),
    enabled: token !== null,
  });
}

export function usePurchase() {
  return useMutation<Entitlement, ApiError, ProductId>({
    mutationFn: (productId) =>
      apiRequest('POST', routes.billing.mockPurchase, entitlementSchema, { productId }),
    onSuccess: (entitlement, productId) => {
      queryClient.setQueryData(queryKeys.entitlement, entitlement);
      analytics.track('trial_started', { productId });
    },
    onError: (error) => analytics.track('purchase_failed', { code: error.code }),
  });
}

export function useRestorePurchases() {
  return useMutation<Entitlement, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.billing.mockRestore, entitlementSchema),
    onSuccess: (entitlement) => {
      queryClient.setQueryData(queryKeys.entitlement, entitlement);
      analytics.track('restore_completed', { restored: entitlement.tier === 'plus' });
    },
  });
}
```

`apps/mobile/src/features/coach/api.ts`:

```ts
import {
  coachHistoryResponseSchema,
  routes,
  sendCoachMessageResponseSchema,
  type CoachMessage,
  type SendCoachMessageResponse,
} from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

export function useCoachMessages() {
  return useQuery<CoachMessage[], ApiError>({
    queryKey: queryKeys.coachMessages,
    queryFn: async () =>
      (await apiRequest('GET', routes.coach.messages, coachHistoryResponseSchema)).messages,
  });
}

// Optimistic: the user's bubble shows at once; on failure it is rolled back and the screen
// puts the text back into the composer.
export function useSendCoachMessage() {
  return useMutation<SendCoachMessageResponse, ApiError, string, { previous: CoachMessage[] }>({
    mutationFn: (text) =>
      apiRequest('POST', routes.coach.messages, sendCoachMessageResponseSchema, { text }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.coachMessages });
      const previous = queryClient.getQueryData<CoachMessage[]>(queryKeys.coachMessages) ?? [];
      const pending: CoachMessage = {
        id: `pending-${Date.now()}`,
        role: 'user',
        text,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<CoachMessage[]>(queryKeys.coachMessages, [...previous, pending]);
      return { previous };
    },
    onError: (error, _text, context) => {
      if (context) queryClient.setQueryData(queryKeys.coachMessages, context.previous);
      analytics.track('coach_send_failed', { code: error.code });
    },
    onSuccess: ({ message, reply }, _text, context) => {
      queryClient.setQueryData<CoachMessage[]>(queryKeys.coachMessages, [
        ...(context?.previous ?? []),
        message,
        reply,
      ]);
      analytics.track('coach_reply_received');
    },
  });
}
```

- [ ] **Step 2: Coach — message source and the teaser view**

`apps/mobile/src/features/coach/coach-chat.tsx`:

```diff
@@ -8,6 +8,7 @@
 import { ScreenState } from '@/components/screen-state';
 import { SUGGESTED_PROMPTS } from '@/content/labels';
 import { useMe } from '@/features/me/api';
+import { analytics } from '@/lib/analytics';
 import { useCoachMessages, useSendCoachMessage } from './api';
 import { Composer } from './composer';
 import { MessageBubble } from './message-bubble';
@@ -20,9 +21,10 @@
   const [draft, setDraft] = useState('');
   const [sendError, setSendError] = useState<string | null>(null);
 
-  const submit = (text: string) => {
+  const submit = (text: string, source: 'prompt' | 'typed') => {
     const trimmed = text.trim();
     if (!trimmed || send.isPending) return;
+    analytics.track('coach_message_sent', { source });
     setSendError(null);
     setDraft('');
     send.mutate(trimmed, {
@@ -62,7 +64,10 @@
       </View>
       <KeyboardAvoidingView behavior="padding" className="flex-1">
         {messages.length === 0 ? (
-          <EmptyConversation name={me.data?.displayName ?? 'there'} onPick={submit} />
+          <EmptyConversation
+            name={me.data?.displayName ?? 'there'}
+            onPick={(prompt) => submit(prompt, 'prompt')}
+          />
         ) : (
           <FlatList
             inverted
@@ -83,7 +88,7 @@
         <Composer
           value={draft}
           onChangeText={setDraft}
-          onSend={() => submit(draft)}
+          onSend={() => submit(draft, 'typed')}
           isSending={send.isPending}
         />
       </KeyboardAvoidingView>
```

`apps/mobile/src/features/coach/coach-teaser.tsx`:

```diff
@@ -1,12 +1,18 @@
 import { router } from 'expo-router';
 import { Typography } from 'heroui-native';
+import { useEffect } from 'react';
 import { ScrollView, View } from 'react-native';
 import { Icon } from '@/components/icon';
 import { SubmitButton } from '@/components/submit-button';
 import { COACH_BENEFITS } from '@/content/labels';
+import { analytics } from '@/lib/analytics';
 
 /** What a free user sees on the Coach tab: what Plus unlocks, and one way in. */
 export function CoachTeaser() {
+  useEffect(() => {
+    analytics.track('coach_teaser_viewed');
+  }, []);
+
   return (
     <ScrollView
       className="flex-1 bg-background"
@@ -36,7 +42,10 @@
           </View>
         ))}
       </View>
-      <SubmitButton label="Unlock Coach" onPress={() => router.push('/paywall')} />
+      <SubmitButton
+        label="Unlock Coach"
+        onPress={() => router.push({ pathname: '/paywall', params: { source: 'coach_teaser' } })}
+      />
     </ScrollView>
   );
 }
```

- [ ] **Step 3: Paywall — view, source, product selection**

`apps/mobile/src/app/paywall.tsx`:

```diff
@@ -1,9 +1,9 @@
 import { PRODUCT_IDS, type ProductId } from '@forge/contracts';
 import * as Haptics from 'expo-haptics';
-import { router } from 'expo-router';
+import { router, useLocalSearchParams } from 'expo-router';
 import { StatusBar } from 'expo-status-bar';
 import { Chip, CloseButton, cn, LinkButton, RadioGroup, Typography, useToast } from 'heroui-native';
-import { useState } from 'react';
+import { useEffect, useState } from 'react';
 import { Platform, ScrollView, View } from 'react-native';
 import { FormAlert } from '@/components/form-alert';
 import { Icon } from '@/components/icon';
@@ -12,8 +12,10 @@
 import { usePurchase, useRestorePurchases } from '@/features/billing/api';
 import { ProductOption } from '@/features/billing/product-option';
 import { PRODUCTS } from '@/features/billing/products';
+import { analytics, type PaywallSource } from '@/lib/analytics';
 
 export default function PaywallScreen() {
+  const { source } = useLocalSearchParams<{ source?: string }>();
   const [productId, setProductId] = useState<ProductId>('forge_plus_yearly');
   const purchase = usePurchase();
   const restore = useRestorePurchases();
@@ -21,12 +23,17 @@
   const product = PRODUCTS.find((candidate) => candidate.id === productId) ?? PRODUCTS[0];
   const error = purchase.error ?? restore.error;
 
+  useEffect(() => {
+    analytics.track('paywall_viewed', { source: toPaywallSource(source) });
+  }, [source]);
+
   const selectProduct = (value: string) => {
     const id = PRODUCT_IDS.find((candidate) => candidate === value);
     // HeroUI reports a tap on the already-selected card too: no change, no haptic.
     if (!id || id === productId) return;
     void Haptics.selectionAsync();
     setProductId(id);
+    analytics.track('product_selected', { productId: id });
   };
 
   // Each action clears the other's stale error first, since the Alert shows whichever is set.
@@ -114,3 +121,8 @@
     </View>
   );
 }
+
+// The in-app entry points say where they are; a typed or shared link does not.
+function toPaywallSource(source: string | undefined): PaywallSource {
+  return source === 'coach_teaser' || source === 'settings' ? source : 'direct';
+}
```

- [ ] **Step 4: Session opened; log out; the Settings entry to the paywall**

`apps/mobile/src/app/session/[id].tsx`:

```diff
@@ -2,7 +2,7 @@
 import * as Haptics from 'expo-haptics';
 import { router, useLocalSearchParams } from 'expo-router';
 import { Chip, Typography, useToast } from 'heroui-native';
-import { useEffect, useRef } from 'react';
+import { useEffect, useEffectEvent, useRef } from 'react';
 import { ScrollView, View } from 'react-native';
 import Animated, {
   useAnimatedStyle,
@@ -15,6 +15,7 @@
 import { SubmitButton } from '@/components/submit-button';
 import { useCompleteSession, usePlan } from '@/features/plan/api';
 import { CheckableBlockRow, StaticBlockRow } from '@/features/session/block-row';
+import { analytics } from '@/lib/analytics';
 import { usePlanCelebration } from '@/stores/celebration-store';
 import { NO_TICKS, useChecklist } from '@/stores/checklist-store';
 
@@ -28,7 +29,19 @@
   const { id } = useLocalSearchParams<{ id: string }>();
   const plan = usePlan();
   const session = plan.data?.sessions.find((candidate) => candidate.id === id);
+  const sessionId = session?.id;
 
+  // Once per session shown, with the status it had when it was opened (completing it here
+  // changes the status, and that is `session_completed`, not a second open).
+  const trackOpened = useEffectEvent(() => {
+    if (session) {
+      analytics.track('session_opened', { sessionId: session.id, status: session.status });
+    }
+  });
+  useEffect(() => {
+    if (sessionId) trackOpened();
+  }, [sessionId]);
+
   if (!session || !plan.data) {
     return (
       <ScreenState
```

`apps/mobile/src/app/(tabs)/settings.tsx`:

```diff
@@ -9,6 +9,7 @@
 import { AnalyticsRow, NotificationsRow, TrackingRow } from '@/features/privacy/privacy-rows';
 import { DeleteAccountDialog } from '@/features/settings/delete-account-dialog';
 import { SettingsSkeleton } from '@/features/settings/settings-skeleton';
+import { analytics } from '@/lib/analytics';
 import { APP_VERSION } from '@/lib/config';
 import { formatDate, initials } from '@/lib/format';
 import { signOut } from '@/lib/session';
@@ -103,7 +104,14 @@
 
         <Section title="Account">
           <ListGroup>
-            <ListGroup.Item accessibilityRole="button" onPress={() => void signOut()}>
+            <ListGroup.Item
+              accessibilityRole="button"
+              onPress={() => {
+                // Tracked before the sign-out resets the consent.
+                analytics.track('logged_out');
+                void signOut();
+              }}
+            >
               <ListGroup.ItemContent>
                 <ListGroup.ItemTitle>Log out</ListGroup.ItemTitle>
               </ListGroup.ItemContent>
@@ -151,7 +159,10 @@
       );
     }
     return (
-      <ListGroup.Item accessibilityRole="button" onPress={() => router.push('/paywall')}>
+      <ListGroup.Item
+        accessibilityRole="button"
+        onPress={() => router.push({ pathname: '/paywall', params: { source: 'settings' } })}
+      >
         <ListGroup.ItemContent>
           <ListGroup.ItemTitle>Free</ListGroup.ItemTitle>
           <ListGroup.ItemDescription>See Forge Plus</ListGroup.ItemDescription>
```

- [ ] **Step 5: Verify (recipe), then walk the funnel with analytics on**

Run the verification recipe. Expected: clean.

Reset Expo Go's permission answers, relaunch, and walk: sign up → onboarding (two goals) →
allow notifications → share usage data → continue on tracking → open Foundation, tick every
block, complete it → Coach tab → "Unlock Coach" → pick Monthly → start the trial → tap
"What's my next session?" → Settings → edit the name → log out.

Compare the Metro log with this sequence (`screen_viewed` lines for every path change are
interleaved and omitted here; the first block arrives all at once when "Share usage data" is
tapped):

```
[analytics] app_opened {}
[analytics] sign_up_completed {}
[analytics] onboarding_completed {"goalCount":2}
[analytics] permission_prompt_viewed {"kind":"notifications"}
[analytics] permission_result {"kind":"notifications","result":"granted"}
[analytics] permission_prompt_viewed {"kind":"analytics"}
[analytics] permission_result {"kind":"analytics","result":"granted"}
[analytics] permission_prompt_viewed {"kind":"tracking"}
[analytics] permission_result {"kind":"tracking","result":"granted"}
[analytics] session_opened {"sessionId":"foundation","status":"open"}
[analytics] session_completed {"sessionId":"foundation","completedCount":1}
[analytics] coach_teaser_viewed {}
[analytics] paywall_viewed {"source":"coach_teaser"}
[analytics] product_selected {"productId":"forge_plus_monthly"}
[analytics] trial_started {"productId":"forge_plus_monthly"}
[analytics] coach_message_sent {"source":"prompt"}
[analytics] coach_reply_received {}
[analytics] profile_updated {"goalCount":2}
[analytics] logged_out {}
```

Also check once each: a wrong password on sign-in produces
`auth_failed {"flow":"sign_in","code":"INVALID_CREDENTIALS"}` only after a later "yes" (it is
queued while signed out); completing Forge produces `plan_completed {}` after its
`session_completed`; "Restart plan" produces `plan_restarted {}`; "Restore purchases" on a
free account produces `restore_completed {"restored":false}`; a typed coach message produces
`coach_message_sent {"source":"typed"}`; the Settings "Free" row opens the paywall with
`paywall_viewed {"source":"settings"}`; deleting the account produces `account_deleted {}`.

No line may contain an email, a display name or message text.

- [ ] **Step 6: Review Focus #1 — "Not now" silences everything**

Note the log's current length. Sign up another user and answer "Not now" on the analytics
step, then repeat the walk from Step 5 up to the coach message. Expected: not one new
`[analytics]` line, including the events from before the answer.

- [ ] **Step 7: Review Focus #2 — a second person on the device**

User A: analytics on; open a session (lines appear); log out (`logged_out {}` is the last
line). User B signs up on the same device: the analytics step is shown again; while it is
unanswered no new line appears; B answers "Not now": still none. Sign B out, sign A in: A is
asked again too (D41).

Delete the test accounts and leave the simulator in light.

- [ ] **Step 8: Record decisions and commit**

Append to `docs/decisions/plan-c.md`:

```markdown
- `useUpdateMe` tells onboarding from a profile edit by `acceptConsent` in the request body · only the onboarding form sends it, and the event must fire at hook level · a future form that sends the consent again would be counted as onboarding
- `session_opened` uses `useEffectEvent` keyed on the session id · the event needs the status at open time without re-firing when completing the session changes that status · none
- `coach_message_sent` fires at send time in the screen, the reply and the failure at hook level · the source (prompt or typed) is only known where the message is composed · a send from a screen that unmounts at once would still be counted as sent
```

```bash
git add apps/mobile docs/decisions/plan-c.md
git commit -m "feat(mobile): funnel events across the app"
```

---

### Task 5: Walkthrough, READMEs, final gate

**Files:**
- Modify: `README.md`, `apps/mobile/README.md`, `docs/decisions/plan-c.md`,
  `docs/screenshots/*`

**Interfaces:**
- Consumes: the whole app.
- Produces: the reviewer-facing documentation for this feature.

- [ ] **Step 1: Walk the app in light and dark**

As a brand-new user on the iPhone 16 simulator with Expo Go's permission answers reset: sign
up, onboard, the three steps, a session, the paywall, the coach, Settings (the Privacy group),
log out. Every new screen and row must match the UI bar in `.claude/rules/mobile.md` in light
and dark. Fix anything that doesn't and re-shoot its screenshot.

- [ ] **Step 2: Android glance**

If an emulator is available (Task 1, Step 3.4): open the app there, sign up, onboard. Expected:
the notifications step (Android 13+ shows its own system dialog) and the analytics step appear;
there is no tracking step; Settings shows no Tracking row. Note the result.

- [ ] **Step 3: `apps/mobile/README.md`**

Add to "How it's put together", after the **UI** bullet:

```markdown
- **Permissions:** after onboarding, one screen each asks for notifications, usage analytics
  and (iOS) App Tracking Transparency; Settings shows and changes all three. The choices live
  on the device and are wiped on sign-out. The app asks for notification permission but sends
  no notifications.
- **Analytics:** `src/lib/analytics` — a typed event map, a consent gate and a mock sink that
  logs `[analytics] <event> <props>` to the Metro console. Strict opt-in: events wait in memory
  until the person answers, "yes" sends them, "no" drops them. Swapping `mock-sink.ts` for a
  real SDK is the only change needed to go live.
```

Add to "Verified on":

```markdown
- The iOS permission alerts run in Expo Go, which shows its own name and its own tracking
  text; the app's strings in `app.json` apply to a standalone build.
```

If Step 2 ran, extend the Android line with what was checked there.

- [ ] **Step 4: Root `README.md`**

In the opening paragraph, after the sentence about the coach chat, add: "After onboarding it
asks — one screen each — for notifications, usage analytics and, on iOS, tracking; analytics is
a mock, strictly opt-in."

Under `## Tests`, replace the `pnpm test` comment line with:

```bash
pnpm test        # contracts smoke test, API unit tests, and the mobile analytics core (node:test)
```

In the `## Screenshots` table add one row:

```markdown
| **Permission step**<br><img src="docs/screenshots/permissions-notifications.png" width="300" alt="Notification permission step"> | **Privacy settings**<br><img src="docs/screenshots/settings-privacy.png" width="300" alt="Privacy settings"> |
```

In `## Architecture`, extend the `apps/mobile` bullet with: "Permission steps and a mock,
opt-in analytics layer (`src/lib/analytics`) cover the funnel."

- [ ] **Step 5: Final gate**

Run: `pnpm i && pnpm build && pnpm typecheck && pnpm lint && pnpm test`
Expected: all green — API 9 suites / 78 tests, contracts 3, mobile 8.

Run: `docker compose up -d --wait && pnpm test:e2e`
Expected: 5 suites, 18 tests pass.

Run: `ls docs/screenshots | grep -c "permissions-\|settings-privacy"`
Expected: 6 (`permissions-notifications`, `-notifications-dark`, `-analytics`, `-tracking`,
`settings-privacy`, `settings-privacy-dark`).

- [ ] **Step 6: Record decisions and commit**

Append to `docs/decisions/plan-c.md` any ruling made during the walkthrough. Then:

```bash
git add apps/mobile README.md docs/screenshots docs/decisions/plan-c.md
git commit -m "docs(mobile): permissions and analytics walkthrough and readmes"
```
