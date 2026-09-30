# @forge/mobile

The Forge app: Expo SDK 57, Expo Router, HeroUI Native + Uniwind. It runs in **Expo Go**, with
no dev client and no native code of its own.

## Run it

From the repo root, with the API running (`pnpm dev:api`):

```bash
cp apps/mobile/.env.example apps/mobile/.env   # optional: only to point at another API URL
pnpm dev:mobile                                # then press i for the iOS Simulator
```

The first `i` installs Expo Go for SDK 57 on the simulator (a large download).
`EXPO_PUBLIC_API_URL` picks the API: `http://localhost:3000` for the simulator,
`http://10.0.2.2:3000` for the Android emulator, and `http://<LAN IP>:3000` for a phone.

## How it's put together

- **Routing:** `src/app` with `Stack.Protected` guards. Signed out → `(auth)`; signed in but
  not onboarded → `onboarding`; onboarded but not yet asked → `permissions`; otherwise →
  `(tabs)` (Plan · Coach · Settings), plus `session/[id]`, `profile` and the `paywall` modal.
- **Server state:** TanStack Query. Only `me` and `plan` persist (AsyncStorage), so a cold
  launch paints instantly and then re-syncs. Every response body is parsed with the
  matching `@forge/contracts` schema.
- **Client state:** Zustand. The JWT lives in SecureStore; checklist ticks and the pending
  unlock celebration live in memory. Signing out wipes the token, both caches and the stores.
- **UI:** HeroUI Native components, with colour and spacing only from theme tokens
  (className). Light/dark follows the system. Reanimated handles motion (with Reduce Motion
  respected) and expo-haptics handles haptics.
- **Permissions:** after onboarding, one screen each asks for notifications, usage analytics
  and (iOS) App Tracking Transparency; Settings shows and changes all three. The choices live
  on the device and are wiped on sign-out. The app asks for notification permission but sends
  no notifications.
- **Analytics:** `src/lib/analytics` — a typed event map, a consent gate and a mock sink that
  logs `[analytics] <event> <props>` to the Metro console. Strict opt-in: events wait in memory
  until the person answers, "yes" sends them, "no" drops them. Swapping `mock-sink.ts` for a
  real SDK is the only change needed to go live. The gate has unit tests (`pnpm test`).

## Verified on

- iPhone 16 simulator (iOS 18.4), Expo Go SDK 57, light and dark.
- Android emulator (Pixel_9_Pro, Android 16), Expo Go SDK 57: sign-in, onboarding and Plan
  checked in light and dark, before the permission steps and analytics were added.
- The permission steps, the Privacy rows and the analytics funnel were checked on iOS only.
  The iOS alerts run inside Expo Go, which shows its own name and its own tracking text; the
  app's strings in `app.json` apply to a standalone build. On Android in Expo Go
  `expo-notifications` cannot load, so it is imported lazily and that step is skipped; this
  path was not run.

Screenshots: [`docs/screenshots/`](../../docs/screenshots/). Decisions:
[`docs/decisions/plan-b.md`](../../docs/decisions/plan-b.md) and
[`plan-c.md`](../../docs/decisions/plan-c.md) (permissions and analytics).
