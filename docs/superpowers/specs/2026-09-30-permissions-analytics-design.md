# Forge — Permissions and Analytics Design Spec

- **Date:** 2026-09-30 · **Status:** draft for review
- **Extends:** `docs/superpowers/specs/2026-09-28-forge-design.md` (the base spec). Everything
  there still holds unless this file says otherwise; section references such as "base §7.3"
  point into it.
- **Amendment to the base spec's non-goals** (user ruling, 2026-09-30). "Push notifications" and
  "analytics" leave the non-goal list in this narrowed form:
  - The app **asks** for notification permission. It still sends and schedules no notifications.
  - The app has an analytics layer with a **mock** sink. No analytics SDK, no network calls.
- **Decision references:** D37–D48 are the rulings made in this spec (§10).

## 1. Intent

Show the privacy handling a shipped app needs, without leaving the take-home's scope:

1. After onboarding, the app asks three things, one screen each: notification permission, usage
   analytics (the app's own opt-in), and on iOS App Tracking Transparency (ATT).
2. Settings shows the three choices and lets the user change them.
3. A mock analytics service receives funnel events from every step of the product: sign-up,
   onboarding, permissions, sessions, paywall, trial, coach, account.
4. Analytics is strict opt-in: nothing reaches the sink unless the user said yes.

Success: a reviewer signs up, sees the three steps look as finished as the rest of the app in
light and dark, and can follow the whole funnel in the Metro log as `[analytics]` lines; a user
who answers "Not now" produces no lines at all.

**Still non-goals:** sending or scheduling notifications, a real analytics or attribution SDK,
storing these choices on the server, consent versioning, any other permission (location,
camera, contacts, photos).

## 2. Constraints

- The app must keep running in Expo Go on the iOS Simulator and the Android emulator.
- `@forge/contracts` stays frozen and `apps/api` is not touched. Every choice in this spec is
  stored on the device (D40).
- **Approved dependency set** gains exactly two mobile packages, installed with
  `npx expo install` (user approval, 2026-09-30): `expo-notifications`,
  `expo-tracking-transparency`. Anything else: ask first.
- Base §7.7 UI rules apply to every new screen and row: default theme, tokens only, one
  primary action per screen, designed states, safe areas, accessibility labels.
- No personal data in events: never the email, display name, goal names typed by hand, or coach
  message text. The user id is attached only after consent (§5.2).

## 3. Permission steps

### 3.1 Route and guard

New route `src/app/permissions.tsx`, one screen that walks through the steps.

The root layout's guards (base §7.1) become:

| Guard | Stack |
|---|---|
| signed out | `(auth)` |
| signed in, not onboarded | `onboarding` |
| signed in, onboarded, prompts not done | `permissions` |
| signed in, onboarded, prompts done | `(tabs)`, `session/[id]`, `profile`, `paywall` |

"Prompts done" is `promptsDone` in the privacy store (§4). The store is persisted, so the boot
gate (base §7.2) also waits for it to hydrate before the splash hides. Users who onboarded
before this feature see the steps once, on their next launch.

### 3.2 Steps

The screen builds its step list when it mounts and shows one step at a time:

1. **Notifications** — shown if the system status is undetermined.
2. **Analytics** — shown if the analytics choice is `unknown`.
3. **Tracking** — iOS only; shown if analytics was granted and the ATT status is undetermined
   (D38).

A step whose answer the system already knows is skipped. When the list is empty or the last
step is answered, the screen sets `promptsDone` and the guard moves to the tabs.

Layout, the same on every step: a progress line ("Step 1 of 3"), an icon in a soft accent
circle, a title, a body, up to three "why" rows with icons, and the actions at the bottom above
the safe area. The total counts the steps that can still appear: the tracking step is counted
while its condition is open, and if analytics is declined the flow simply ends after that step.

| Step | Title | Body | Primary | Secondary |
|---|---|---|---|---|
| Notifications | Stay on track | Get a nudge when your next session is ready. Only about your plan, never marketing. | Turn on notifications | Not now |
| Analytics | Help improve Forge | Share which screens you open and when you finish a session. Never your name, email or coach messages. | Share usage data | Not now |
| Tracking | One more choice | iOS will ask whether Forge may link your activity with other apps and websites. Forge works the same either way. | Continue | — |

Behaviour:

- **Notifications, primary:** calls the system request. The step ends with whatever the system
  returns. **Secondary:** no system dialog, status stays undetermined, so Settings can ask
  later.
- **Analytics, primary:** sets the choice to `granted`. **Secondary:** sets it to `denied`.
- **Tracking:** one action only, which always shows the system alert (D39). There is no way to
  skip the alert from this screen.
- While a system request is open the primary button shows its pending state and ignores
  presses.
- The user cannot go back to an answered step; the steps are short and every answer can be
  changed in Settings.

### 3.3 Permission access (`src/lib/permissions.ts`)

A thin wrapper so screens never import the Expo modules directly:

```ts
type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'unavailable';

getNotificationStatus(): Promise<PermissionStatus>
requestNotifications(): Promise<PermissionStatus>
getTrackingStatus(): Promise<PermissionStatus>      // 'unavailable' on Android
requestTracking(): Promise<PermissionStatus>        // 'unavailable' on Android
openSystemSettings(): Promise<void>                 // Linking.openSettings()
```

A module that cannot load or throws in Expo Go reports `unavailable`; the step is skipped and
the Settings row says so. Settings reads the two statuses through TanStack Query
(`['permission', 'notifications']`, `['permission', 'tracking']`, not persisted), so returning
from the system Settings app refreshes them through the existing focus wiring.

`app.json` gains the `expo-tracking-transparency` plugin with a `userTrackingPermission` string
("Forge uses this to measure which features help you train, across apps and websites.") and the
`expo-notifications` plugin. Both matter only in a standalone build; Expo Go shows its own
strings (§9).

## 4. Privacy store (`src/stores/privacy-store.ts`)

Zustand, persisted to AsyncStorage under `forge.privacy`:

```ts
interface PrivacyState {
  analytics: 'unknown' | 'granted' | 'denied';
  promptsDone: boolean;
  setAnalytics(choice: 'granted' | 'denied'): void;
  setPromptsDone(): void;
  reset(): void;   // back to { analytics: 'unknown', promptsDone: false }
}
```

- `signOut()` (base §7.3, `src/lib/session.ts`) also calls `reset()`. The choices belong to the
  person, so they go with the rest of that person's data on sign-out and on account deletion
  (D41). The next sign-in on the device is asked again; the two system steps are skipped when
  iOS already knows the answer, so a returning user sees at most the analytics step.
- `signIn()` does **not** reset the store: the events queued before and during sign-up must
  survive until the person answers the analytics step (§5.2).
- The store is the single source for the analytics choice. It pushes every change into the
  analytics service (§5.2).

## 5. Analytics

### 5.1 Files

```
src/lib/analytics/
  events.ts      the typed event map (§6)
  core.ts        createAnalytics(sink): queue, consent gate, identity — no React Native imports
  mock-sink.ts   console + in-memory buffer
  index.ts       the app's singleton: createAnalytics(mockSink), wired to the privacy store
  core.test.ts   unit tests (§8)
```

### 5.2 Service

```ts
interface AnalyticsRecord {
  name: EventName;
  props: Record<string, string | number | boolean>;
  timestamp: string;          // ISO
  userId: string | null;
}
interface AnalyticsSink { send(record: AnalyticsRecord): void }

interface Analytics {
  track<E extends EventName>(name: E, ...props: PropsOf<E>): void;
  setConsent(choice: 'unknown' | 'granted' | 'denied'): void;
  identify(userId: string | null): void;
  reset(): void;
}
```

Rules (D42):

- **`unknown`:** `track` puts the record in an in-memory queue, capped at 100 (oldest dropped).
- **`granted`:** the queue is flushed to the sink in order, stamped with the current user id,
  then every later `track` goes straight to the sink.
- **`denied`:** the queue is dropped and `track` does nothing.
- **Switching `denied` → `granted` later** (Settings) starts from that moment; nothing is
  backfilled.
- **`identify`** is called with the user id whenever a signed-in profile is loaded and with
  `null` on sign-out. Records carry the id only while consent is granted.
- **`reset`** clears the queue and the identity and returns consent to `unknown`. It runs from
  the privacy store's `reset()`.
- The queue is never written to disk: events a user has not agreed to share do not outlive the
  process.

A consequence worth stating: an "analytics denied" answer is never reported, because reporting
it would itself be tracking.

### 5.3 Mock sink

`send` writes one line to the console — `[analytics] <name> <props as JSON>` — and keeps the
last 200 records in memory, readable through `getSentRecords()` for debugging and tests. A real
SDK replaces this one file.

## 6. Funnel events

Outcome events fire in the feature hooks' own `onSuccess` / `onError` (hook level, so they
survive the calling screen unmounting); view events fire in a screen effect; `screen_viewed`
fires from one hook in the root navigator that watches the Expo Router pathname.

| Event | Props | Fires when |
|---|---|---|
| `app_opened` | — | the boot gate becomes ready |
| `screen_viewed` | `path` | the pathname changes |
| `sign_up_completed` | — | sign-up succeeds |
| `sign_in_completed` | — | sign-in succeeds |
| `auth_failed` | `flow` (`sign_up`/`sign_in`), `code` | either fails |
| `onboarding_completed` | `goalCount` | the onboarding PATCH succeeds |
| `permission_prompt_viewed` | `kind` (`notifications`/`analytics`/`tracking`) | a step is shown |
| `permission_result` | `kind`, `result` (`granted`/`denied`/`skipped`) | a step is answered; also when a Settings row changes a choice |
| `session_opened` | `sessionId`, `status` | the session screen shows a known session |
| `session_completed` | `sessionId`, `completedCount` | completion succeeds |
| `plan_completed` | — | the completion that finishes the plan succeeds |
| `plan_restarted` | — | restart succeeds |
| `coach_teaser_viewed` | — | a free user sees the teaser |
| `paywall_viewed` | `source` (`coach_teaser`/`settings`/`direct`) | the paywall mounts |
| `product_selected` | `productId` | a different product is picked |
| `trial_started` | `productId` | the mock purchase succeeds |
| `purchase_failed` | `code` | the mock purchase fails |
| `restore_completed` | `restored` | restore succeeds, with or without a purchase |
| `coach_message_sent` | `source` (`prompt`/`typed`) | a message is sent |
| `coach_reply_received` | — | the reply arrives |
| `coach_send_failed` | `code` | the send fails |
| `profile_updated` | `goalCount` | the edit-profile PATCH succeeds |
| `logged_out` | — | the user logs out, before the wipe |
| `account_deleted` | — | deletion succeeds, before the wipe |

- `permission_result.result`: notifications and tracking report what the system returned, or
  `skipped` for "Not now". For `kind: analytics` only `granted` can ever be delivered (§5.2).
- `paywall_viewed.source` comes from a `source` route param set by the two in-app entry points;
  a missing param means `direct`.
- `code` is an `ApiError` code (`NETWORK`, `INVALID_CREDENTIALS`, …), never a message.
- `logged_out` and `account_deleted` are tracked before `signOut()` resets consent, so a
  consenting user's last event is delivered.

## 7. Settings

The Privacy group (base §8) grows from one row to four:

| Row | Value | Tap |
|---|---|---|
| Data consent | Accepted {date} | — (unchanged) |
| Notifications | On · Off · Not set · Unavailable | not set → system request; on/off → system Settings |
| Tracking (iOS only) | Allowed · Not allowed · Not set | not set → system request; otherwise → system Settings |
| Usage analytics | a switch | toggles the choice |

While a status is loading the row shows a skeleton line, never a guessed value (the lesson of
the membership row). The analytics switch reflects the store at once; turning it on calls
`identify` and starts tracking, turning it off stops it.

## 8. Testing

- **`core.ts` has unit tests** with Node's built-in runner, no new dependency: Node 24 runs
  TypeScript directly, and `core.ts` imports nothing from React Native (D45). Script:
  `"test": "node --test src/lib/analytics/"` in `apps/mobile/package.json`, picked up by
  `pnpm test`. Cases:
  - `unknown` queues and sends nothing;
  - `granted` flushes the queue in order with the user id, then sends directly;
  - `denied` drops the queue and later `track` calls do nothing;
  - `denied` → `granted` does not backfill;
  - the queue cap drops the oldest record;
  - `reset` clears queue, identity and consent;
  - records carry no user id before `identify`.
  If the first plan task finds this cannot run without a new dependency, the task stops and
  reports; the fallback is the mobile TDD exemption with the rules above checked by hand.
- **Screens** follow the mobile exemption: `mobile-self-check` after each screen task, with
  screenshots of the three steps (light; the first also dark) and the new Settings rows.
- **Funnel check:** one walkthrough with analytics granted, comparing the `[analytics]` lines in
  the Metro log against §6 in order; one with "Not now", confirming the log has no
  `[analytics]` line.
- API tests are unaffected: 78 unit, 18 e2e.

## 9. Risks (the first plan task settles them before any screen is built)

1. **System dialogs in Expo Go.** Both dialogs must appear on the iOS Simulator in Expo Go. The
   ATT alert there carries Expo Go's own usage string, not ours; the README says so.
2. **Re-testing.** iOS shows each system dialog once per app. The task records how to reset the
   simulator's answers for Expo Go, or states that a fresh simulator is needed.
3. **`expo-notifications` on Android in Expo Go** may log an error about remote push on import.
   If it does, the wrapper loads the module lazily and reports `unavailable` there.
4. **Node running the TypeScript tests** (§8) — relative imports need explicit `.ts`
   extensions; if Metro or `tsc` reject that, the fallback in §8 applies.

## 10. Decision log (what · why · cost if wrong)

| # | What | Why | Cost if wrong |
|---|---|---|---|
| D37 | Permission steps sit between onboarding and the tabs, one screen per step | the user chose this placement; priming before a system alert explains the ask and keeps a "Not now" from burning the one-shot iOS prompt | three taps before the first session |
| D38 | ATT is asked only after analytics is granted, and only on iOS | without analytics there is nothing to link across apps; Android has no ATT | a user who enables analytics later in Settings is asked for ATT from its row, not automatically |
| D39 | The tracking step has a single "Continue" that always shows the system alert | Apple's guidance for a screen shown before the ATT alert: one action, no wording like "Allow", no way around the alert | none |
| D40 | Analytics choice and "prompts done" live on the device only | contracts are frozen and the API is out of scope | a reinstall asks again |
| D41 | Sign-out and account deletion reset the privacy store | base D28: nothing of one user survives for the next | a returning user answers the analytics step again |
| D42 | Strict opt-in with an in-memory queue, flushed on "yes" and dropped on "no" | the user chose strict opt-in; queueing keeps the pre-consent part of the funnel for people who agree | events from before a crash or restart are lost while undecided |
| D43 | Explicit outcome events plus one automatic `screen_viewed` | outcomes describe the funnel, screen views describe navigation; each has one obvious home | two mechanisms to explain |
| D44 | Outcome events fire in hook-level callbacks | call-level callbacks are skipped after unmount (found in the base project's final review) | none |
| D45 | The analytics core is React-Native-free and tested with `node --test` | real tests for the consent rules without adding a test framework | if Node cannot run it, the rules are only hand-checked |
| D46 | No personal data in events; ids and counts only | the consent copy promises it | coarser analysis |
| D47 | The app asks for notification permission but sends none | the request was for the permission flow; delivery needs a push service or local scheduling, both out of scope | the permission is asked ahead of its use; the README says so |
| D48 | Expo modules are reached only through `src/lib/permissions.ts` | one place to handle Expo Go gaps and platform differences | none |

## 11. Plan

One plan, **Plan C — permissions and analytics**, executed like Plans A and B:

1. Feasibility and analytics core: install the two packages, settle §9, `core.ts` with tests,
   mock sink, singleton.
2. Privacy store, permission wrapper, the permissions screen, the new guard and boot-gate wait.
3. Settings rows.
4. Funnel events across the existing screens and hooks.
5. Walkthrough, screenshots, README and decisions (`docs/decisions/plan-c.md`).
