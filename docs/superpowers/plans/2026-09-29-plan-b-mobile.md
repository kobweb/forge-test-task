# Plan B — Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All of `apps/mobile` per `.claude/rules/mobile.md` and spec §7–§8, looking finished in
light and dark on an iPhone 16 simulator:
- sign in / sign up, onboarding with multi-goal, the Plan timeline with its unlock motion;
- session checklist and completion, paywall, coach chat, settings with edit profile and account
  deletion;
- a `mobile-self-check` pass after every screen task, a final walkthrough, and
  `apps/mobile/README.md`.

**Architecture:** Expo Router, with `Stack.Protected` guards on the token and `me.onboarded`.
- **Server state:** TanStack Query. Only `['me']` and `['plan']` persist to AsyncStorage
  (decision B). Every response is parsed with the `@forge/contracts` schema.
- **Client state:** Zustand. The JWT is kept in SecureStore; checklist ticks and the pending
  celebration live in memory.
- **UI:** HeroUI Native components styled only with Uniwind tokens. Motion uses Reanimated,
  haptics use expo-haptics.

**Tech Stack:** Expo SDK 57 (RN 0.86, React 19.2), Expo Router 57, HeroUI Native 1.0.10,
Uniwind 1.12 + Tailwind 4, TanStack Query 5 (+ persist-client, async-storage persister), Zustand
5, react-hook-form 7 + @hookform/resolvers 5 + zod 4, react-native-keyboard-controller 1.21,
Reanimated 4.5, expo-haptics, expo-secure-store, @expo/vector-icons.

**Spec:** `docs/superpowers/specs/2026-09-28-forge-design.md` (§7, §8, §9.1–§9.3, the mobile
half of §10, and §11 "Plan B").
- Plan 0 must be on main (it provides the Expo skeleton), and so must Plan A (the API that
  every self-check talks to).
- Use the `heroui-native` skill (`.claude/skills/heroui-native`) whenever you need a component
  API that isn't shown here.

## Global Constraints

Copied verbatim from the spec (section in brackets). This block is identical in Plans 0, A
and B, and every task's requirements include it.

- [§2] Runtime: Node 24 (`.nvmrc`); pnpm **10.34.5** pinned via root `packageManager`.
- [§2] Monorepo: Turborepo 2.x, pnpm workspaces, `nodeLinker: hoisted`.
- [§2] TypeScript: **~6.0.3** in every package.
- [§2] Contracts: zod 4.x.
- [§2] API: NestJS **11.2.x** (npm `legacy` tag), @nestjs/jwt 11, drizzle-orm 0.45 + drizzle-kit
  0.31, postgres (postgres.js) 3.4, bcryptjs 3, Jest 30 + ts-jest 29 + supertest 7.
- [§2] Database: Postgres 16 via docker-compose.
- [§2] Mobile: Expo SDK **57** (RN 0.86.3, React 19.2.3), Expo Router 57, HeroUI Native 1.0.x,
  Uniwind 1.x, Tailwind 4.x.
- [§2] Native-module versions are never hand-picked: `npx expo install <pkg>` resolves the SDK 57
  set (reanimated 4.5.1, worklets 0.10.1, gesture-handler ~2.32, safe-area-context ~5.7, screens
  ~4.26, svg 15.15.4, async-storage 2.2.0, keyboard-controller 1.21.9). All run in Expo Go.
- [§2] **Approved dependency set** (anything else: ask first, per CLAUDE.md):
  - **root (dev):** turbo, prettier.
  - **contracts:** zod · dev: typescript.
  - **api:** @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/jwt (all 11),
    reflect-metadata, rxjs, drizzle-orm, postgres, bcryptjs, zod, @forge/contracts · dev:
    @nestjs/cli, @nestjs/schematics, @nestjs/testing (11), drizzle-kit, jest, ts-jest,
    @types/jest, supertest, @types/supertest, @types/node, typescript, and the ESLint/Prettier
    toolchain that `nest new` generates.
  - **mobile:** expo, expo-router, react, react-native, expo-constants, expo-linking,
    expo-status-bar, expo-splash-screen, expo-system-ui, expo-secure-store, expo-haptics,
    @expo/vector-icons, react-native-safe-area-context, react-native-screens,
    react-native-gesture-handler, react-native-reanimated, react-native-worklets,
    react-native-svg, heroui-native, uniwind, tailwindcss, tailwind-variants, tailwind-merge,
    @tanstack/react-query, @tanstack/react-query-persist-client,
    @tanstack/query-async-storage-persister, @react-native-async-storage/async-storage, zustand,
    react-hook-form, @hookform/resolvers, zod, **react-native-keyboard-controller** (new, D20),
    @forge/contracts · dev: typescript, @types/react, eslint, eslint-config-expo.
  - **Deliberately not used:** expo-blur and @gorhom/bottom-sheet (optional HeroUI peers; no
    BottomSheet or blur), NetInfo, dotenv, @nestjs/config, class-validator.
- [§4] Contracts — `@forge/contracts` (frozen once Plan 0 is on main). Nothing else is shared
  between apps.
- [§4.2] Validation messages are user-facing copy: the API returns them in 400 bodies and the
  mobile forms show them inline.
- [§6.1] Each module has `*.controller.ts` (HTTP only: pipe-validated input, `userId` from the
  guard, returns a contract type) → `*.service.ts` (domain rules; throws `AppError`) →
  `*.repository.ts` (port interface + DI token) → `*.drizzle.ts` (adapter). In-memory adapters
  live in `apps/api/test/in-memory/`. Unit specs sit next to their services.
- [§6.3] The body is always `{ code, message }`.
- [§6.4] every non-`@Public()` route requires `Authorization: Bearer <jwt>`. The token must
  verify and `sub` must still exist, so a deleted account's token gets 401.
- [§1] Every screen looks finished in light and dark on an iPhone 15/16 simulator (UI bar in
  `.claude/rules/mobile.md`).
- [§7.7] UI rules (Plan B review checklist):
  - Default HeroUI Native theme, system light/dark, no custom theme.
  - Colour and spacing only through tokens. Anything that can't take a `className` (icons, tab
    bar, `RefreshControl` tint) gets its colour from theme hooks (HeroUI `useThemeColor` or
    Uniwind CSS variables) — never a literal.
  - One primary action per screen (listed in §8).
  - Every data screen has designed loading (Skeleton), error (ScreenState + "Try again") and,
    where one exists, empty states.
  - Safe areas respected; the sticky CTA sits above the tab bar.
  - Accessibility labels on timeline cards and icon-only buttons.
  - Copy exactly as written in §8–§9.
- [Amendments to the brief] Where `docs/product.md` and this spec disagree, this spec wins:
  Scope 2: "one goal" becomes one or more goals (1–3) from the same three options.
- [§10] **Gate before every commit:** `pnpm typecheck && pnpm lint && pnpm test`, plus
  `pnpm test:e2e` for API tasks that touch HTTP or the DB.

## Review Focus

Failure modes the spec implies but no step exercises by default, most likely first. The mobile
app has no automated tests (TDD exemption), so each is pinned by a named self-check step.

1. **Cold relaunch while the API is down.** A signed-in user must see their cached plan
   instantly, with no error flash, and pull-to-refresh must fail quietly. *Task 9, Step 3.*
2. **Double-tapping "Complete session".** Exactly one completion must happen (1 of 3, not 2 of
   3), and exactly one celebration. *Task 5, Step 4.*
3. **The keyboard covering what you're typing.** The focused field and the chat composer must
   stay visible on iPhone 16. *Task 2, Step 4 · Task 3, Step 3 · Task 7, Step 3.*
4. **The session ending on the server while the app is open** (the account was deleted
   elsewhere). The app must return to sign-in with "Your session ended. Please sign in
   again.", and the next user must see none of the previous user's data. *Task 9, Step 4.*
5. **A 40-character name and all three goals.** The greeting must wrap to at most two lines,
   the chips must wrap, and the Settings rows must truncate. *Task 8, Step 4.*

## Execution notes

All of these were hit and verified while this plan's code was built and run against a scratch
copy of the repo on 2026-09-29.

- **Toolchain.** If Node or `pnpm` is missing or the wrong version, re-run the command as
  `source ~/.nvm/nvm.sh && nvm use 24 && <cmd>`; never work around it. `pnpm` comes from
  corepack: once the root `package.json` pins `packageManager`, `pnpm -v` prints `10.34.5`.
  Prefix commands with `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` if corepack asks to download.
- **Commits.** Conventional Commits, one commit per task, never rewrite history, never push
  (`.claude/rules/git.md`). End each commit message with the attribution trailer your harness
  specifies.
- **Decisions.** Every task ends by appending the listed lines to `docs/decisions/<plan>.md`
  (`what · why · cost if wrong`). Add a line for any further non-obvious ruling you make.
- **Ports.** The API defaults to 3000, but another process on this machine may already hold it
  (check with `lsof -nP -iTCP:3000 -sTCP:LISTEN`). If it's taken, set `PORT=3001` in
  `apps/api/.env` and `EXPO_PUBLIC_API_URL=http://localhost:3001` in `apps/mobile/.env`. Both
  files are git-ignored; leave the defaults in the `.env.example` files unchanged.
- **Long-running processes** (`docker compose`, `pnpm dev:api`, `expo start`) run in the
  background; never block a step on them.
- **Expo Go, first run.** `npx expo start --ios` downloads Expo Go for SDK 57 (about 550 MB)
  before opening the app, which can take several minutes. Don't kill it. On first launch Expo
  Go shows a developer-menu intro sheet: tap Continue, then close the menu.
- **Typing into the simulator.** Key events use the Mac's current keyboard layout, so a
  non-Latin layout turns `alex@forge.test` into other characters. Put the text on the
  simulator pasteboard instead (`printf 'alex@forge.test' | xcrun simctl pbcopy booted`), then
  long-press the field and choose Paste.
- **Simulator screenshots can lag** by one action. Wait about 1.5 s after a tap before taking a
  screenshot. After you leave a filled-in password form, iOS may show a "Save Password?" sheet:
  tap "Not Now".
- **Shell safety.** `.claude/settings.json` denies `rm -rf /*` and `rm -rf ~*`. Use relative
  paths inside the repo (`rm -rf apps/mobile/.git`), never an absolute path.

## File structure

```
apps/mobile/src/
  env.d.ts · global.css · uniwind-types.d.ts            (from Plan 0)
  app/
    _layout.tsx                 providers · boot gate · Stack.Protected guards · ErrorBoundary
    (auth)/_layout.tsx · (auth)/sign-in.tsx · (auth)/sign-up.tsx
    onboarding.tsx
    (tabs)/_layout.tsx · (tabs)/index.tsx (Plan) · (tabs)/coach.tsx · (tabs)/settings.tsx
    session/[id].tsx · profile.tsx · paywall.tsx
  lib/        config · api · notices · query-client · session · format · navigation-theme
  stores/     session-store · checklist-store · celebration-store
  content/    labels.ts
  components/ icon · screen-state · notice-toaster · submit-button · form-alert · form-screen
              form-text-field · form-password-field
  features/
    auth/api.ts · me/api.ts · billing/{api.ts, products.ts, product-option.tsx}
    profile/{goals-field.tsx, consent-field.tsx}
    plan/{api.ts, plan-header.tsx, use-celebration-motion.ts, timeline-item.tsx,
          next-session-bar.tsx, plan-complete-card.tsx, plan-skeleton.tsx}
    session/block-row.tsx
    coach/{api.ts, coach-teaser.tsx, coach-chat.tsx, message-bubble.tsx, typing-indicator.tsx, composer.tsx}
    settings/{settings-skeleton.tsx, delete-account-dialog.tsx}
apps/mobile/README.md · docs/decisions/plan-b.md · docs/screenshots/*.png
```

**Verification recipe used by every task.** From the repo root:
`pnpm --filter @forge/mobile typecheck && pnpm --filter @forge/mobile lint && (cd apps/mobile && npx expo export --platform ios --output-dir "$(mktemp -d)")`

Expected: no type errors, `0 problems` from ESLint, and `Exported: …` from the bundler.
`eslint-config-expo` includes the React Compiler rules (`react-hooks/refs`,
`react-hooks/set-state-in-effect`); the code below already satisfies them, so keep it that way.

**Self-check.** Run the `mobile-self-check` skill (it starts Postgres, the API and Expo).
- Save screenshots to `docs/screenshots/<screen>[-<state>].png`, and keep only the final image
  for each screen/state.
- For dark variants, run `xcrun simctl ui booted appearance dark`, and switch back to `light`
  afterwards.
- To make a test user without the keyboard, use curl against the API (see Plan A's curl
  preamble). Then sign in through the app, pasting from the simulator pasteboard (see
  Execution notes).

---

### Task 1: App shell — data layer, stores, providers, guards, placeholder routes

**Files:**
- Delete: `apps/mobile/src/app/index.tsx` (the Plan 0 placeholder; `(tabs)/index.tsx` owns `/`
  now)
- Create: `src/lib/config.ts`, `api.ts`, `notices.ts`, `query-client.ts`, `session.ts`,
  `format.ts`, `navigation-theme.ts`
- Create: `src/stores/session-store.ts`, `checklist-store.ts`, `celebration-store.ts`
- Create: `src/content/labels.ts`
- Create: `src/components/icon.tsx`, `screen-state.tsx`, `notice-toaster.tsx`
- Create: `src/features/me/api.ts`, `src/features/billing/api.ts`
- Replace: `src/app/_layout.tsx`
- Create: `src/app/(auth)/_layout.tsx`, `src/app/(tabs)/_layout.tsx`
- Create (placeholders, replaced by later tasks): `src/app/(auth)/sign-in.tsx`,
  `(auth)/sign-up.tsx`, `onboarding.tsx`, `(tabs)/index.tsx`, `(tabs)/coach.tsx`,
  `(tabs)/settings.tsx`, `session/[id].tsx`, `profile.tsx`, `paywall.tsx`

(All paths are under `apps/mobile/`.)

**Interfaces:**
- Consumes (`@forge/contracts`): `apiErrorSchema`, `ErrorCode`, `AuthResponse`, `User`,
  `UpdateMeBody`, `userSchema`, `Entitlement`, `ProductId`, `entitlementSchema`, `routes`,
  `SessionId`, `Goal`, `BlockKind`.
- Produces (later tasks use these exact names):
  - **Config:** `API_URL`, `APP_VERSION`.
  - **API client:**
    - `ApiError { code: ErrorCode | 'NETWORK'; message; status: number | null }`;
    - `apiRequest<T>(method, path, schema: z.ZodType<T>, body?)`;
    - `apiRequestNoContent(method, path)`;
    - `messageOf(error)`;
    - `setUnauthorizedHandler(fn)`.
  - **Notices:** `publishNotice(message)`, `subscribeToNotices(listener)`.
  - **Query client:** `queryKeys { me, plan, entitlement, coachMessages }`, `queryClient`,
    `persister`, `persistOptions`.
  - **Session:** `signIn(auth: AuthResponse)` and `signOut(reason?: 'expired' | 'deleted')`.
  - **Format:** `greeting(now)`, `formatDate(iso, { withYear })`,
    `initials(displayName, email)`.
  - **Navigation theme:** `useNavigationTheme()`.
  - **Stores:**
    - `useSession { token; setToken }` and `useSessionHydrated()`;
    - `useChecklist { ticked; toggle; clear; reset }` and `NO_TICKS`;
    - `usePlanCelebration { pending; celebrate; consume }` and `Celebration`.
  - **Content:** `GOAL_LABELS`, `BLOCK_LABELS`, `SUGGESTED_PROMPTS`, `COACH_BENEFITS`.
  - **Components:** `Icon`, `IconName`, `ScreenState`, `NoticeToaster`.
  - **Queries and mutations:**
    - `useMe()`, `useUpdateMe()`, `useDeleteAccount()`;
    - `useEntitlement()`, `usePurchase()`, `useRestorePurchases()`.

- [ ] **Step 1: Data layer**

Run: `rm apps/mobile/src/app/index.tsx`

```ts
import Constants from 'expo-constants';

// Simulator: localhost. Android emulator: 10.0.2.2. Phone: your computer's LAN IP.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
```

```ts
// Lets code outside React (the API client, signOut) ask the UI to show a toast.
type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function publishNotice(message: string): void {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToNotices(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
```

```ts
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

// The JWT lives in the Keychain / Keystore, never in AsyncStorage.
const secureStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

interface SessionState {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: 'forge.session',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ token: state.token }),
    },
  ),
);

/** True once the token has been read back from SecureStore on launch. */
export function useSessionHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSession.persist.onFinishHydration(onChange),
    () => useSession.persist.hasHydrated(),
  );
}
```

```ts
import { apiErrorSchema, type ErrorCode } from '@forge/contracts';
import type { z } from 'zod';
import { useSession } from '@/stores/session-store';
import { API_URL } from './config';

export type ApiErrorCode = ErrorCode | 'NETWORK';

/** Every failed request becomes one of these; `message` is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const TIMEOUT_MS = 15_000;

let handleUnauthorized: () => void = () => {};

/** Called when a request that carried a token gets 401 (expired token, deleted account). */
export function setUnauthorizedHandler(handler: () => void): void {
  handleUnauthorized = handler;
}

/** JSON request whose response is parsed with a @forge/contracts schema. */
export async function apiRequest<T>(
  method: Method,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  const response = await send(method, path, body);
  return schema.parse(await response.json());
}

/** Request whose success response has no body (204). */
export async function apiRequestNoContent(method: Method, path: string): Promise<void> {
  await send(method, path, undefined);
}

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

async function send(method: Method, path: string, body: unknown): Promise<Response> {
  const token = useSession.getState().token;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('NETWORK', "Can't reach Forge. Check your connection and try again.", null);
  } finally {
    clearTimeout(timeout);
  }
  if (response.ok) return response;

  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));
  if (response.status === 401 && token) handleUnauthorized();
  throw parsed.success
    ? new ApiError(parsed.data.code, parsed.data.message, response.status)
    : new ApiError('INTERNAL', 'Something went wrong. Please try again.', response.status);
}
```

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { AppState } from 'react-native';
import { ApiError } from './api';
import { APP_VERSION } from './config';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const queryKeys = {
  me: ['me'],
  plan: ['plan'],
  entitlement: ['entitlement'],
  coachMessages: ['coach', 'messages'],
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: WEEK_MS, // must outlive maxAge, or restored queries are dropped
      // Retry network and server hiccups, never 4xx answers.
      retry: (failureCount, error) =>
        failureCount < 2 &&
        !(error instanceof ApiError && error.status !== null && error.status < 500),
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'forge.query-cache',
});

// Decision B: persist only `me` and `plan`, so a cold launch paints instantly, then re-syncs.
const PERSISTED_KEYS = new Set<unknown>([queryKeys.me[0], queryKeys.plan[0]]);

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: WEEK_MS,
  buster: APP_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && PERSISTED_KEYS.has(query.queryKey[0]),
  },
};

// Refetch stale queries when the app returns to the foreground.
AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
```

```ts
import type { SessionId } from '@forge/contracts';
import { create } from 'zustand';

// Ticked blocks per session, in memory only: decision A keeps no per-session rows on the
// server, and ticks only exist to pace the user through one workout.
interface ChecklistState {
  ticked: Partial<Record<SessionId, number[]>>;
  toggle: (sessionId: SessionId, blockIndex: number) => void;
  clear: (sessionId: SessionId) => void;
  reset: () => void;
}

export const NO_TICKS: readonly number[] = [];

export const useChecklist = create<ChecklistState>()((set) => ({
  ticked: {},
  toggle: (sessionId, blockIndex) =>
    set((state) => {
      const current = state.ticked[sessionId] ?? [];
      const next = current.includes(blockIndex)
        ? current.filter((index) => index !== blockIndex)
        : [...current, blockIndex];
      return { ticked: { ...state.ticked, [sessionId]: next } };
    }),
  clear: (sessionId) => set((state) => ({ ticked: { ...state.ticked, [sessionId]: [] } })),
  reset: () => set({ ticked: {} }),
}));
```

```ts
import type { SessionId } from '@forge/contracts';
import { create } from 'zustand';

// Set when a session is completed (or the plan restarted); the Plan screen plays it once,
// the next time it is on screen.
export type Celebration = { kind: 'unlock'; sessionId: SessionId } | { kind: 'planComplete' };

interface CelebrationState {
  pending: Celebration | null;
  celebrate: (celebration: Celebration) => void;
  consume: () => Celebration | null;
}

export const usePlanCelebration = create<CelebrationState>()((set, get) => ({
  pending: null,
  celebrate: (celebration) => set({ pending: celebration }),
  consume: () => {
    const { pending } = get();
    if (pending) set({ pending: null });
    return pending;
  },
}));
```

```ts
import type { AuthResponse } from '@forge/contracts';
import { usePlanCelebration } from '@/stores/celebration-store';
import { useChecklist } from '@/stores/checklist-store';
import { useSession } from '@/stores/session-store';
import { setUnauthorizedHandler } from './api';
import { publishNotice } from './notices';
import { persister, queryClient, queryKeys } from './query-client';

const SIGN_OUT_NOTICES = {
  expired: 'Your session ended. Please sign in again.',
  deleted: 'Your account and data were deleted.',
} as const;

// Everything cached belongs to one user, so it is wiped whenever the user changes.
async function clearUserData(): Promise<void> {
  queryClient.clear();
  await persister.removeClient();
  useChecklist.getState().reset();
  usePlanCelebration.setState({ pending: null });
}

export async function signIn({ token, user }: AuthResponse): Promise<void> {
  await clearUserData();
  queryClient.setQueryData(queryKeys.me, user);
  useSession.getState().setToken(token);
}

export async function signOut(reason?: keyof typeof SIGN_OUT_NOTICES): Promise<void> {
  // Token first: the route guards leave the signed-in screens before their data disappears.
  useSession.getState().setToken(null);
  await clearUserData();
  if (reason) publishNotice(SIGN_OUT_NOTICES[reason]);
}

setUnauthorizedHandler(() => {
  void signOut('expired');
});
```

```ts
export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "28 Sep 2026" (or "5 Oct" without the year), in the device's locale. */
export function formatDate(iso: string, { withYear = true } = {}): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(iso));
}

export function initials(displayName: string | null, email: string): string {
  const source = displayName?.trim() || email;
  return source
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
```

- [ ] **Step 2: Content, theme bridge and shared components**

```ts
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
```

```ts
import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import { useUniwind } from 'uniwind';

/** React Navigation's theme (headers, tab bar, screen backgrounds) built from HeroUI tokens. */
export function useNavigationTheme(): Theme {
  const { theme } = useUniwind();
  const [background, foreground, separator, accent, danger] = useThemeColor([
    'background',
    'foreground',
    'separator',
    'accent',
    'danger',
  ] as const);
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent,
      background,
      card: background,
      text: foreground,
      border: separator,
      notification: danger,
    },
  };
}
```

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { withUniwind } from 'uniwind';

/** Ionicons that take their colour from a className token, e.g. `className="text-muted"`. */
export const Icon = withUniwind(Ionicons);

export type IconName = ComponentProps<typeof Ionicons>['name'];
```

```tsx
import { Button, Typography } from 'heroui-native';
import { View } from 'react-native';
import { Icon, type IconName } from './icon';

interface ScreenStateProps {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full-screen empty / error / not-found state with at most one action. */
export function ScreenState({ icon, title, body, actionLabel, onAction }: ScreenStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-5 bg-background px-8">
      <View className="size-14 items-center justify-center rounded-full bg-accent-soft">
        <Icon name={icon} size={26} className="text-accent-soft-foreground" />
      </View>
      <View className="items-center gap-1.5">
        <Typography type="h5" align="center">
          {title}
        </Typography>
        {body ? (
          <Typography type="body-sm" color="muted" align="center">
            {body}
          </Typography>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button variant="secondary" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
```

```tsx
import { useToast } from 'heroui-native';
import { useEffect } from 'react';
import { subscribeToNotices } from '@/lib/notices';

/** Shows notices published outside React (session expiry, account deletion) as toasts. */
export function NoticeToaster() {
  const { toast } = useToast();
  useEffect(() => subscribeToNotices((message) => toast.show({ label: message })), [toast]);
  return null;
}
```

- [ ] **Step 3: Profile and entitlement queries**

```ts
import { routes, userSchema, type UpdateMeBody, type User } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
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
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiRequestNoContent('DELETE', routes.me),
    onSuccess: () => signOut('deleted'),
  });
}
```

```ts
import { entitlementSchema, routes, type Entitlement, type ProductId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
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
    onSuccess: (entitlement) => queryClient.setQueryData(queryKeys.entitlement, entitlement),
  });
}

export function useRestorePurchases() {
  return useMutation<Entitlement, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.billing.mockRestore, entitlementSchema),
    onSuccess: (entitlement) => queryClient.setQueryData(queryKeys.entitlement, entitlement),
  });
}
```

- [ ] **Step 4: Root layout, group layouts and placeholder routes**

`src/app/_layout.tsx`:

```tsx
import '../global.css';
import '@/lib/session'; // registers the 401 → sign-out handler

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useIsRestoring } from '@tanstack/react-query';
import { Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { NoticeToaster } from '@/components/notice-toaster';
import { ScreenState } from '@/components/screen-state';
import { useMe } from '@/features/me/api';
import { useNavigationTheme } from '@/lib/navigation-theme';
import { persistOptions, queryClient } from '@/lib/query-client';
import { useSession, useSessionHydrated } from '@/stores/session-store';

void SplashScreen.preventAutoHideAsync();

// Last-resort screen for a render error anywhere below. Plain RN + Uniwind tokens only, so it
// renders even when the providers above are what failed.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
      <Text className="text-center text-xl font-semibold text-foreground">
        Something went wrong
      </Text>
      <Text className="text-center text-base text-muted">
        Try again. If it keeps happening, restart the app.
      </Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        className="rounded-full bg-accent px-6 py-3"
      >
        <Text className="font-semibold text-accent-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <NoticeToaster />
            <RootNavigator />
            <StatusBar style="auto" />
          </PersistQueryClientProvider>
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const navigationTheme = useNavigationTheme();
  const sessionHydrated = useSessionHydrated();
  const restoringCache = useIsRestoring();
  const signedIn = useSession((state) => state.token !== null);
  const me = useMe();

  // The splash stays up until we know which stack to show: token read, cache restored, and
  // (for a signed-in user without a cached profile) the first GET /me settled.
  const ready = sessionHydrated && !restoringCache && !(signedIn && me.isPending);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (signedIn && !me.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't reach Forge"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void me.refetch()}
      />
    );
  }

  const onboarded = me.data?.onboarded === true;
  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="session/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'Plan',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: true,
              title: 'Edit profile',
              headerBackTitle: 'Settings',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
```

`src/app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'sign-in' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`src/app/(tabs)/_layout.tsx` (JS tabs come from `expo-router/js-tabs`; the root `Tabs` export
is deprecated in Expo Router 57):

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useEntitlement } from '@/features/billing/api';

export default function TabsLayout() {
  useEntitlement(); // prefetch, so the Coach tab opens without a spinner

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

Placeholder routes. Each file is one `ScreenState`, and the task that builds the real screen
replaces it. Create each file with exactly this shape, substituting the three values from the
table:

```tsx
import { ScreenState } from '@/components/screen-state';

export default function SignInScreen() {
  return <ScreenState icon="construct-outline" title="Sign in" body="Built in Plan B, Task 2." />;
}
```

| File | Component name | `title` | `body` |
|---|---|---|---|
| `src/app/(auth)/sign-in.tsx` | `SignInScreen` | Sign in | Built in Plan B, Task 2. |
| `src/app/(auth)/sign-up.tsx` | `SignUpScreen` | Create account | Built in Plan B, Task 2. |
| `src/app/onboarding.tsx` | `OnboardingScreen` | Onboarding | Built in Plan B, Task 3. |
| `src/app/(tabs)/index.tsx` | `PlanScreen` | Plan | Built in Plan B, Task 4. |
| `src/app/session/[id].tsx` | `SessionScreen` | Session | Built in Plan B, Task 5. |
| `src/app/paywall.tsx` | `PaywallScreen` | Forge Plus | Built in Plan B, Task 6. |
| `src/app/(tabs)/coach.tsx` | `CoachScreen` | Coach | Built in Plan B, Task 7. |
| `src/app/(tabs)/settings.tsx` | `SettingsScreen` | Settings | Built in Plan B, Task 8. |
| `src/app/profile.tsx` | `ProfileScreen` | Edit profile | Built in Plan B, Task 8. |

- [ ] **Step 5: Verify (recipe)**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

- [ ] **Step 6: Self-check the boot path**

Run `mobile-self-check`. Verify:
- The native splash stays until the token and cache are restored, then the "Sign in"
  placeholder appears (no token yet).
- Light and dark both use theme tokens, including the status bar.
- Metro logs no warnings about routes.

No screenshots are kept for placeholders.

- [ ] **Step 7: Record decisions and commit**

Create `docs/decisions/plan-b.md`:

```markdown
# Plan B — decisions (what · why · cost if wrong)

- The API client exposes `apiRequest(method, path, schema, body?)` and `apiRequestNoContent` instead of the spec's single `request()` sketch · a schema is required whenever a body is expected, so every response is parsed (D27) · none
- `signOut()` clears the token first, then the caches · the route guards leave signed-in screens before their queries lose data · none
- Notices published outside React (401 → "session ended", deletion) are shown by `<NoticeToaster />` · HeroUI's `useToast()` only works inside the provider · none
- React Navigation's theme is built from HeroUI tokens (`useNavigationTheme`) · headers, the tab bar and screen backgrounds follow light/dark without literals · none
- Tabs import from `expo-router/js-tabs` · the root `Tabs` export is deprecated in Expo Router 57 · none
- The splash uses `expo-splash-screen` directly · expo-router's `SplashScreen` export is marked hidden · none
- The root `ErrorBoundary` uses plain RN + Uniwind classes, not HeroUI · it must render even when the providers are what failed · it looks slightly plainer
- Session hydration uses `useSyncExternalStore` · the React Compiler lint rejects setState inside an effect · none
```

```bash
git add apps/mobile docs/decisions/plan-b.md
git commit -m "feat(mobile): app shell with api client, query persistence, stores and route guards"
```

---

### Task 2: Sign in and sign up

**Files:**
- Create: `src/components/submit-button.tsx`, `form-alert.tsx`, `form-screen.tsx`,
  `form-text-field.tsx`, `form-password-field.tsx`
- Create: `src/features/auth/api.ts`
- Replace: `src/app/(auth)/sign-in.tsx`, `src/app/(auth)/sign-up.tsx`

**Interfaces:**
- Consumes:
  - Task 1: `apiRequest`, `ApiError`, `signIn`, `Icon`.
  - `@forge/contracts`: `authResponseSchema`, `loginBodySchema`, `signupBodySchema`,
    `LoginBody`, `SignupBody`, `AuthResponse`, `routes`.
- Produces:
  - `SubmitButton { label; onPress; isPending?; isDisabled?; variant?: 'primary' | 'danger' }`,
    which ignores presses while pending.
  - `FormAlert { message }` and `FormScreen { title?; subtitle?; children; footer?; hasHeader? }`.
  - `FormTextField` and `FormPasswordField`: generic over react-hook-form values, taking
    `{ control; name; label; description?; ref? }` plus Input props.
  - `useSignIn()` and `useSignUp()`.

- [ ] **Step 1: Shared form building blocks**

```tsx
import { Button, Spinner, useThemeColor } from 'heroui-native';

interface SubmitButtonProps {
  label: string;
  onPress: () => void;
  isPending?: boolean;
  isDisabled?: boolean;
  variant?: 'primary' | 'danger';
}

/** The screen's primary action. While pending it shows a spinner and ignores further presses. */
export function SubmitButton({
  label,
  onPress,
  isPending = false,
  isDisabled = false,
  variant = 'primary',
}: SubmitButtonProps) {
  const spinnerColor = useThemeColor(
    variant === 'danger' ? 'danger-foreground' : 'accent-foreground',
  );
  return (
    <Button
      size="lg"
      variant={variant}
      isDisabled={isDisabled}
      onPress={isPending ? undefined : onPress}
      accessibilityState={{ busy: isPending, disabled: isDisabled }}
    >
      {isPending ? (
        <Spinner size="sm" color={spinnerColor} />
      ) : (
        <Button.Label>{label}</Button.Label>
      )}
    </Button>
  );
}
```

```tsx
import { Alert } from 'heroui-native';

/** A form-level error that belongs to no single field. */
export function FormAlert({ message }: { message: string }) {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
```

```tsx
import { cn, Typography } from 'heroui-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface FormScreenProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** True when a native header already sits above the screen. */
  hasHeader?: boolean;
}

/** Scrollable, keyboard-aware form layout: the focused field is never hidden by the keyboard. */
export function FormScreen({
  title,
  subtitle,
  children,
  footer,
  hasHeader = false,
}: FormScreenProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      className="flex-1 bg-background"
      contentContainerClassName={cn(
        'grow gap-8 px-6 pb-safe-offset-6',
        hasHeader ? 'pt-6' : 'pt-safe-offset-10',
      )}
    >
      {title ? (
        <View className="gap-2">
          <Typography.Heading type="h2">{title}</Typography.Heading>
          {subtitle ? (
            <Typography type="body" color="muted">
              {subtitle}
            </Typography>
          ) : null}
        </View>
      ) : null}
      <View className="gap-5">{children}</View>
      {footer ? <View className="mt-auto items-center">{footer}</View> : null}
    </KeyboardAwareScrollView>
  );
}
```

`FormTextField` reads `value`, `onChange` and `onBlur` from `useController` but never
`field.ref`: the React Compiler lint (`react-hooks/refs`) rejects property reads from an object
that holds a ref. Focus chaining goes through a plain `ref` prop instead.

```tsx
import { Description, FieldError, Input, Label, TextField, type InputProps } from 'heroui-native';
import type { Ref } from 'react';
import type { TextInput } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

interface FormTextFieldProps<TValues extends FieldValues, TOutput> extends Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'ref'
> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
  ref?: Ref<TextInput>;
}

/** A labelled text input bound to react-hook-form, with its error shown inline. */
export function FormTextField<TValues extends FieldValues, TOutput>({
  control,
  name,
  label,
  description,
  ref,
  ...inputProps
}: FormTextFieldProps<TValues, TOutput>) {
  const {
    field: { value, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  return (
    <TextField isInvalid={fieldState.invalid}>
      <Label>{label}</Label>
      <Input
        ref={ref}
        value={String(value ?? '')}
        onChangeText={onChange}
        onBlur={onBlur}
        {...inputProps}
      />
      {description ? <Description hideOnInvalid>{description}</Description> : null}
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}
```

```tsx
import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
  type InputProps,
} from 'heroui-native';
import { useState, type Ref } from 'react';
import { Pressable, type TextInput } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Icon } from './icon';

interface FormPasswordFieldProps<TValues extends FieldValues, TOutput> extends Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'secureTextEntry' | 'ref'
> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
  ref?: Ref<TextInput>;
}

/** Password input with a show/hide toggle, bound to react-hook-form. */
export function FormPasswordField<TValues extends FieldValues, TOutput>({
  control,
  name,
  label,
  description,
  ref,
  ...inputProps
}: FormPasswordFieldProps<TValues, TOutput>) {
  const {
    field: { value, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const [isVisible, setIsVisible] = useState(false);
  return (
    <TextField isInvalid={fieldState.invalid}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input
          ref={ref}
          value={String(value ?? '')}
          onChangeText={onChange}
          onBlur={onBlur}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
        />
        <InputGroup.Suffix>
          <Pressable
            onPress={() => setIsVisible((visible) => !visible)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={isVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              className="text-muted"
            />
          </Pressable>
        </InputGroup.Suffix>
      </InputGroup>
      {description ? <Description hideOnInvalid>{description}</Description> : null}
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}
```

- [ ] **Step 2: Auth mutations and the two screens**

```ts
import {
  authResponseSchema,
  routes,
  type AuthResponse,
  type LoginBody,
  type SignupBody,
} from '@forge/contracts';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '@/lib/api';
import { signIn } from '@/lib/session';

export function useSignIn() {
  return useMutation<AuthResponse, ApiError, LoginBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.login, authResponseSchema, body),
    onSuccess: signIn,
  });
}

export function useSignUp() {
  return useMutation<AuthResponse, ApiError, SignupBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.signup, authResponseSchema, body),
    onSuccess: signIn,
  });
}
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { loginBodySchema, type LoginBody } from '@forge/contracts';
import { router } from 'expo-router';
import { LinkButton } from 'heroui-native';
import { useRef } from 'react';
import type { TextInput } from 'react-native';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormPasswordField } from '@/components/form-password-field';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useSignIn } from '@/features/auth/api';

type LoginForm = z.input<typeof loginBodySchema>;

export default function SignInScreen() {
  const signIn = useSignIn();
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit } = useForm<LoginForm, unknown, LoginBody>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit((body) => signIn.mutate(body));

  return (
    <FormScreen
      title="Forge"
      subtitle="Three sessions. Unlocked in order."
      footer={
        <LinkButton onPress={() => router.replace('/sign-up')}>
          New here? Create an account
        </LinkButton>
      }
    >
      {signIn.error ? <FormAlert message={signIn.error.message} /> : null}
      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormPasswordField
        ref={passwordRef}
        control={control}
        name="password"
        label="Password"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      <SubmitButton label="Sign in" isPending={signIn.isPending} onPress={() => void submit()} />
    </FormScreen>
  );
}
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { signupBodySchema, type SignupBody } from '@forge/contracts';
import { router } from 'expo-router';
import { LinkButton } from 'heroui-native';
import { useRef } from 'react';
import type { TextInput } from 'react-native';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormPasswordField } from '@/components/form-password-field';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useSignUp } from '@/features/auth/api';

type SignupForm = z.input<typeof signupBodySchema>;

export default function SignUpScreen() {
  const signUp = useSignUp();
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit, setError } = useForm<SignupForm, unknown, SignupBody>({
    resolver: zodResolver(signupBodySchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit((body) =>
    signUp.mutate(body, {
      onError: (error) => {
        // A taken email belongs to the email field, not to a form-level alert.
        if (error.code === 'EMAIL_TAKEN') setError('email', { message: error.message });
      },
    }),
  );
  const formError = signUp.error && signUp.error.code !== 'EMAIL_TAKEN' ? signUp.error : null;

  return (
    <FormScreen
      title="Create your account"
      subtitle="Your plan and progress stay private to you."
      footer={
        <LinkButton onPress={() => router.replace('/sign-in')}>
          Already have an account? Sign in
        </LinkButton>
      }
    >
      {formError ? <FormAlert message={formError.message} /> : null}
      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormPasswordField
        ref={passwordRef}
        control={control}
        name="password"
        label="Password"
        description="At least 8 characters."
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      <SubmitButton
        label="Create account"
        isPending={signUp.isPending}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}
```

- [ ] **Step 3: Verify (recipe)**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

- [ ] **Step 4: Self-check (keeps the screenshots)**

Run `mobile-self-check`. Capture:
- `sign-in.png`: empty.
- `sign-in-errors.png`: tap "Sign in" with empty fields. Inline "Enter a valid email address."
  and "Enter your password." appear, and the fields turn danger.
- `sign-in-invalid-credentials.png`: a wrong password. The form Alert reads "Email or password
  is incorrect."
- `sign-up.png`, and `sign-up-email-taken.png` (an existing email; the inline error is under
  Email, with no form Alert).
- Network error: stop the API and submit. The form Alert reads "Can't reach Forge. Check your
  connection and try again." Restart the API afterwards.

**Review Focus #3:** focus Password with the software keyboard shown (⌘K in the simulator).
The field and the submit button must stay visible above the keyboard.

After a successful sign-up, the guard must switch to the "Onboarding" placeholder.

- [ ] **Step 5: Record decisions and commit**

Append to `docs/decisions/plan-b.md`:

```markdown
- Form fields never read `field.ref`; the email → password focus hand-off uses a `useRef` passed as `ref` · the React Compiler lint (`react-hooks/refs`) flags reading the controller's field object · react-hook-form can't focus the first invalid field by itself
- Form layouts use `KeyboardAwareScrollView` (`bottomOffset={24}`) from react-native-keyboard-controller (D20) · the focused field stays visible on every screen size · none
- Icon glyph sizes are numeric props, but icon colours always come from className tokens (`withUniwind(Ionicons)`) · Ionicons only accepts a numeric `size`, like HeroUI's own `iconProps` · none
```

```bash
git add apps/mobile docs/screenshots docs/decisions/plan-b.md
git commit -m "feat(mobile): sign in and sign up with inline validation"
```

---

### Task 3: Onboarding — name, multi-goal, consent

**Files:**
- Create: `src/features/profile/goals-field.tsx`, `src/features/profile/consent-field.tsx`
- Replace: `src/app/onboarding.tsx`

**Interfaces:**
- Consumes:
  - Tasks 1–2: `useUpdateMe`, `FormScreen`, `FormTextField`, `FormAlert`, `SubmitButton`,
    `GOAL_LABELS`.
  - `@forge/contracts`: `GOALS`, `Goal`, `onboardingBodySchema`, `OnboardingBody`.
- Produces:
  - `GoalsField { control; name }`: a multi-select of card toggles with a selection haptic.
  - `ConsentField { control; name }`.

- [ ] **Step 1: The two custom fields**

```tsx
import { GOALS, type Goal } from '@forge/contracts';
import * as Haptics from 'expo-haptics';
import { cn, ControlField, Description, FieldError, Label } from 'heroui-native';
import { View } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { GOAL_LABELS } from '@/content/labels';

interface GoalsFieldProps<TValues extends FieldValues, TOutput> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
}

/** Multi-select goals as tappable cards. The contracts schema requires at least one. */
export function GoalsField<TValues extends FieldValues, TOutput>({
  control,
  name,
}: GoalsFieldProps<TValues, TOutput>) {
  const { field, fieldState } = useController({ control, name });
  const selected: Goal[] = Array.isArray(field.value) ? (field.value as Goal[]) : [];

  const toggle = (goal: Goal) => {
    void Haptics.selectionAsync();
    field.onChange(
      selected.includes(goal) ? selected.filter((item) => item !== goal) : [...selected, goal],
    );
  };

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Label>What are you training for?</Label>
        <Description>Pick as many as you like.</Description>
      </View>
      {GOALS.map((goal) => {
        const isSelected = selected.includes(goal);
        return (
          <ControlField
            key={goal}
            isSelected={isSelected}
            onSelectedChange={() => toggle(goal)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            className={cn(
              'rounded-3xl border-2 bg-surface p-4',
              isSelected ? 'border-accent' : 'border-transparent',
            )}
          >
            <View className="flex-1 gap-0.5">
              <Label>{GOAL_LABELS[goal].title}</Label>
              <Description>{GOAL_LABELS[goal].description}</Description>
            </View>
            <ControlField.Indicator variant="checkbox" />
          </ControlField>
        );
      })}
      <FieldError isInvalid={fieldState.invalid}>{fieldState.error?.message}</FieldError>
    </View>
  );
}
```

```tsx
import { ControlField, FieldError, Typography } from 'heroui-native';
import { View } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

interface ConsentFieldProps<TValues extends FieldValues, TOutput> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
}

export function ConsentField<TValues extends FieldValues, TOutput>({
  control,
  name,
}: ConsentFieldProps<TValues, TOutput>) {
  const { field, fieldState } = useController({ control, name });
  const isSelected = field.value === true;
  return (
    <View className="gap-1.5">
      <ControlField
        isSelected={isSelected}
        onSelectedChange={field.onChange}
        isInvalid={fieldState.invalid}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        className="items-start"
      >
        <ControlField.Indicator variant="checkbox" />
        <Typography type="body-sm" className="flex-1">
          I agree that Forge stores my profile, progress and coach messages to personalise my
          training. I can delete all of it in Settings.
        </Typography>
      </ControlField>
      <FieldError isInvalid={fieldState.invalid}>{fieldState.error?.message}</FieldError>
    </View>
  );
}
```

- [ ] **Step 2: The onboarding screen**

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingBodySchema, type OnboardingBody } from '@forge/contracts';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useUpdateMe } from '@/features/me/api';
import { ConsentField } from '@/features/profile/consent-field';
import { GoalsField } from '@/features/profile/goals-field';

type OnboardingForm = z.input<typeof onboardingBodySchema>;

export default function OnboardingScreen() {
  const updateMe = useUpdateMe();
  const { control, handleSubmit } = useForm<OnboardingForm, unknown, OnboardingBody>({
    resolver: zodResolver(onboardingBodySchema),
    defaultValues: { displayName: '', goals: [], acceptConsent: false },
  });
  // On success the cached profile says onboarded, and the route guard moves on to the plan.
  const submit = handleSubmit((body) => updateMe.mutate(body));

  return (
    <FormScreen title="Make it yours" subtitle="Three quick things before your first session.">
      {updateMe.error ? <FormAlert message={updateMe.error.message} /> : null}
      <FormTextField
        control={control}
        name="displayName"
        label="What should we call you?"
        placeholder="Your first name"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
      />
      <GoalsField control={control} name="goals" />
      <ConsentField control={control} name="acceptConsent" />
      <SubmitButton
        label="Start training"
        isPending={updateMe.isPending}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}
```

- [ ] **Step 3: Verify, then self-check**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

Run `mobile-self-check` with a freshly signed-up user. Capture:
- `onboarding.png`: empty.
- `onboarding-errors.png`: "Start training" with nothing filled in shows "Tell us what to call
  you.", "Pick at least one goal." and "Please accept to continue.".
- `onboarding-filled.png`: two goals selected. Each selected card has an accent border and a
  checked box, and each toggle gives a selection haptic.

**Review Focus #3:** with the software keyboard shown, the name field stays visible.

Submitting moves to the Plan placeholder, and a second launch skips onboarding.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile docs/screenshots
git commit -m "feat(mobile): onboarding with name, multiple goals and consent"
```

---

### Task 4: Plan — header, timeline, sticky "Next session" bar, unlock motion

**Files:**
- Create: `src/features/plan/api.ts`, `plan-header.tsx`, `use-celebration-motion.ts`,
  `timeline-item.tsx`, `next-session-bar.tsx`, `plan-complete-card.tsx`, `plan-skeleton.tsx`
- Replace: `src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes:
  - Tasks 1–2: `usePlanCelebration`, `useMe`, `ScreenState`, `Icon`, `SubmitButton`,
    `GOAL_LABELS`, `greeting`, `queryClient`, `queryKeys`, `apiRequest`, `useSession`.
  - `@forge/contracts`: `planViewSchema`, `PlanView`, `PlanSession`, `SessionId`, `Goal`,
    `routes`.
- Produces:
  - `usePlan()`, `useCompleteSession()` (mutation variable: `SessionId`) and `useResetPlan()`.
  - `useCelebrationMotion(active)` → `{ cardStyle, borderStyle, connectorStyle }`.
  - `TimelineItem`, `NextSessionBar`, `PlanHeader`, `PlanCompleteCard` and `PlanSkeleton`.

- [ ] **Step 1: Plan queries and mutations**

```ts
import { planViewSchema, routes, type PlanView, type SessionId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useSession } from '@/stores/session-store';

export function usePlan() {
  const token = useSession((state) => state.token);
  return useQuery<PlanView, ApiError>({
    queryKey: queryKeys.plan,
    queryFn: () => apiRequest('GET', routes.plan.get, planViewSchema),
    enabled: token !== null,
  });
}

// The server decides what unlocks; its answer replaces the cached plan.
export function useCompleteSession() {
  return useMutation<PlanView, ApiError, SessionId>({
    mutationFn: (sessionId) => apiRequest('POST', routes.plan.complete(sessionId), planViewSchema),
    onSuccess: (plan) => queryClient.setQueryData(queryKeys.plan, plan),
  });
}

export function useResetPlan() {
  return useMutation<PlanView, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.plan.reset, planViewSchema),
    onSuccess: (plan) => queryClient.setQueryData(queryKeys.plan, plan),
  });
}
```

- [ ] **Step 2: Header, motion hook, timeline item, sticky bar, complete card, skeleton**

```tsx
import type { Goal } from '@forge/contracts';
import { Chip, cn, Typography } from 'heroui-native';
import { View } from 'react-native';
import { GOAL_LABELS } from '@/content/labels';
import { greeting } from '@/lib/format';

interface PlanHeaderProps {
  displayName: string;
  goals: Goal[];
  completedCount: number;
  totalCount: number;
}

export function PlanHeader({ displayName, goals, completedCount, totalCount }: PlanHeaderProps) {
  return (
    <View className="gap-5">
      <View className="gap-3">
        <Typography.Heading type="h3" numberOfLines={2}>
          {`${greeting(new Date())}, ${displayName}`}
        </Typography.Heading>
        <View className="flex-row flex-wrap gap-2">
          {goals.map((goal) => (
            <Chip key={goal} size="sm" variant="soft">
              {GOAL_LABELS[goal].title}
            </Chip>
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Typography type="body-sm" color="muted">
          {`${completedCount} of ${totalCount} complete`}
        </Typography>
        <View
          className="flex-row gap-1.5"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: totalCount, now: completedCount }}
        >
          {Array.from({ length: totalCount }, (_, index) => (
            <View
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                index < completedCount ? 'bg-accent' : 'bg-default',
              )}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
```

```ts
import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * The one-off "unlocked" motion: the card springs from 0.96 to 1, its accent border fades in
 * and the connector above it fills. With Reduce Motion on, only the fades run.
 */
export function useCelebrationMotion(active: boolean) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const glow = useSharedValue(1);
  const fill = useSharedValue(1);

  useEffect(() => {
    if (!active) return;
    glow.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 450 }));
    fill.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 350 }));
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.96, { duration: 0 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  }, [active, reducedMotion, scale, glow, fill]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const borderStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const connectorStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: fill.value }] }));

  return { cardStyle, borderStyle, connectorStyle };
}
```

```tsx
import type { PlanSession } from '@forge/contracts';
import { Chip, cn, PressableFeedback, Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { useCelebrationMotion } from './use-celebration-motion';

interface TimelineItemProps {
  session: PlanSession;
  isFirst: boolean;
  isLast: boolean;
  previousCompleted: boolean;
  celebrate: boolean;
  onPress: () => void;
}

/** One session on the timeline: a status node on the rail, joined to its neighbours, and a card. */
export function TimelineItem({
  session,
  isFirst,
  isLast,
  previousCompleted,
  celebrate,
  onPress,
}: TimelineItemProps) {
  const { cardStyle, borderStyle, connectorStyle } = useCelebrationMotion(celebrate);
  const { status } = session;

  return (
    <View className="flex-row gap-4">
      <View className="w-8 items-center">
        <View className={cn('w-0.5 flex-1', isFirst ? 'bg-transparent' : 'bg-separator')}>
          {!isFirst && previousCompleted ? (
            <Animated.View
              style={[connectorStyle, { transformOrigin: 'top' }]}
              className="flex-1 bg-accent"
            />
          ) : null}
        </View>
        <StatusNode status={status} />
        <View
          className={cn(
            'w-0.5 flex-1',
            isLast ? 'bg-transparent' : status === 'completed' ? 'bg-accent' : 'bg-separator',
          )}
        />
      </View>

      <PressableFeedback
        onPress={onPress}
        className="flex-1 py-2"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabelFor(session)}
      >
        <Animated.View style={cardStyle}>
          <Surface
            variant={status === 'completed' ? 'secondary' : 'default'}
            className={cn('gap-1.5', status === 'locked' && 'shadow-none')}
          >
            {status === 'open' ? (
              <Animated.View
                pointerEvents="none"
                style={borderStyle}
                className="absolute inset-0 rounded-3xl border-2 border-accent"
              />
            ) : null}
            <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
              {`Session ${session.number} · ${session.durationMinutes} min`}
            </Typography>
            <Typography type="h5" color={status === 'open' ? 'default' : 'muted'}>
              {session.title}
            </Typography>
            <Typography type="body-sm" color="muted">
              {session.subtitle}
            </Typography>
            <View className="mt-2 flex-row items-center gap-1.5">
              <StatusLine session={session} />
            </View>
          </Surface>
        </Animated.View>
      </PressableFeedback>
    </View>
  );
}

function StatusNode({ status }: { status: PlanSession['status'] }) {
  if (status === 'completed') {
    return (
      <View className="size-8 items-center justify-center rounded-full bg-accent">
        <Icon name="checkmark" size={18} className="text-accent-foreground" />
      </View>
    );
  }
  if (status === 'open') {
    return (
      <View className="size-8 items-center justify-center rounded-full border-2 border-accent bg-background">
        <View className="size-3 rounded-full bg-accent" />
      </View>
    );
  }
  return (
    <View className="size-8 items-center justify-center rounded-full bg-default">
      <Icon name="lock-closed" size={14} className="text-muted" />
    </View>
  );
}

function StatusLine({ session }: { session: PlanSession }) {
  if (session.status === 'completed') {
    return (
      <>
        <Icon name="checkmark-circle" size={16} className="text-muted" />
        <Typography type="body-sm" color="muted">
          Completed
        </Typography>
      </>
    );
  }
  if (session.status === 'open') {
    return (
      <Chip size="sm" color="accent">
        Up next
      </Chip>
    );
  }
  return (
    <>
      <Icon name="lock-closed" size={14} className="text-muted" />
      <Typography type="body-sm" color="muted">
        {`Unlocks after Session ${session.number - 1}`}
      </Typography>
    </>
  );
}

function accessibilityLabelFor(session: PlanSession): string {
  const where = `Session ${session.number}, ${session.title}`;
  if (session.status === 'completed') return `${where}, completed`;
  if (session.status === 'open') return `${where}, up next`;
  return `${where}, locked. Unlocks after Session ${session.number - 1}`;
}
```

```tsx
import type { PlanView } from '@forge/contracts';
import { Button, Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import { SubmitButton } from '@/components/submit-button';

interface NextSessionBarProps {
  plan: PlanView;
  onStart: () => void;
  onRestart: () => void;
  isRestarting: boolean;
}

/** The Plan screen's one primary action, pinned above the tab bar. */
export function NextSessionBar({ plan, onStart, onRestart, isRestarting }: NextSessionBarProps) {
  const next = plan.sessions.find((session) => session.id === plan.nextSessionId);

  return (
    <View className="absolute inset-x-0 bottom-0 px-5 pb-3">
      <Surface className="flex-row items-center gap-4 shadow-overlay">
        <View className="flex-1 gap-0.5">
          <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
            {next ? 'Next session' : 'Plan complete'}
          </Typography>
          <Typography type="body" weight="semibold" numberOfLines={1}>
            {next
              ? `${next.title} · ${next.durationMinutes} min`
              : `${plan.completedCount} of ${plan.totalCount} sessions`}
          </Typography>
        </View>
        {next ? (
          <Button onPress={onStart}>Start</Button>
        ) : (
          <View className="min-w-32">
            <SubmitButton label="Restart plan" isPending={isRestarting} onPress={onRestart} />
          </View>
        )}
      </Surface>
    </View>
  );
}
```

```tsx
import { Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Icon } from '@/components/icon';

export function PlanCompleteCard({ animate }: { animate: boolean }) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View entering={animate && !reducedMotion ? FadeInDown.duration(400) : undefined}>
      <Surface variant="secondary" className="flex-row items-center gap-4">
        <View className="size-11 items-center justify-center rounded-full bg-success">
          <Icon name="trophy" size={22} className="text-success-foreground" />
        </View>
        <View className="flex-1 gap-0.5">
          <Typography type="h6">Plan complete</Typography>
          <Typography type="body-sm" color="muted">
            All three sessions done. Run it back to lock in the habit.
          </Typography>
        </View>
      </Surface>
    </Animated.View>
  );
}
```

```tsx
import { SkeletonGroup } from 'heroui-native';
import { View } from 'react-native';

export function PlanSkeleton() {
  return (
    <View className="flex-1 bg-background px-5 pt-safe-offset-4">
      <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
        <SkeletonGroup.Item className="h-8 w-3/4 rounded-lg" />
        <SkeletonGroup.Item className="h-6 w-1/2 rounded-lg" />
        <SkeletonGroup.Item className="h-2 w-full rounded-full" />
        <SkeletonGroup.Item className="mt-4 h-32 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-32 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-32 w-full rounded-3xl" />
      </SkeletonGroup>
    </View>
  );
}
```

- [ ] **Step 3: The Plan screen**

The celebration is derived from the store while the screen is focused, never copied into React
state (the React Compiler lint forbids setState inside an effect). Children start their
animation on that render; the effect then fires the haptic and consumes the celebration.

```tsx
import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { useThemeColor, useToast } from 'heroui-native';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ScreenState } from '@/components/screen-state';
import { useMe } from '@/features/me/api';
import { usePlan, useResetPlan } from '@/features/plan/api';
import { NextSessionBar } from '@/features/plan/next-session-bar';
import { PlanCompleteCard } from '@/features/plan/plan-complete-card';
import { PlanHeader } from '@/features/plan/plan-header';
import { PlanSkeleton } from '@/features/plan/plan-skeleton';
import { TimelineItem } from '@/features/plan/timeline-item';
import { usePlanCelebration } from '@/stores/celebration-store';

export default function PlanScreen() {
  const plan = usePlan();
  const me = useMe();
  const resetPlan = useResetPlan();
  const { toast } = useToast();
  const refreshTint = useThemeColor('muted');
  const isFocused = useIsFocused();
  const pending = usePlanCelebration((state) => state.pending);
  // A pending celebration plays while this screen is on screen, then is consumed. Children
  // start their animation on this render; the effect below fires the haptic and clears it.
  const celebration = isFocused && plan.data ? pending : null;

  useEffect(() => {
    if (!celebration) return;
    void (celebration.kind === 'unlock'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    usePlanCelebration.getState().consume();
  }, [celebration]);

  if (plan.isPending) return <PlanSkeleton />;
  if (!plan.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't load your plan"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void plan.refetch()}
      />
    );
  }

  const { sessions, completedCount, totalCount, nextSessionId } = plan.data;

  const restart = () =>
    resetPlan.mutate(undefined, {
      onSuccess: () => {
        toast.show({ label: 'Plan restarted', description: 'Foundation is open again.' });
        usePlanCelebration.getState().celebrate({ kind: 'unlock', sessionId: 'foundation' });
      },
      onError: (error) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        toast.show({ variant: 'danger', label: error.message });
      },
    });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-40 pt-safe-offset-4"
        refreshControl={
          <RefreshControl
            refreshing={plan.isRefetching}
            onRefresh={() => void plan.refetch()}
            tintColor={refreshTint}
          />
        }
      >
        <PlanHeader
          displayName={me.data?.displayName ?? 'there'}
          goals={me.data?.goals ?? []}
          completedCount={completedCount}
          totalCount={totalCount}
        />
        {nextSessionId === null ? (
          <PlanCompleteCard animate={celebration?.kind === 'planComplete'} />
        ) : null}
        <View>
          {sessions.map((session, index) => (
            <TimelineItem
              key={session.id}
              session={session}
              isFirst={index === 0}
              isLast={index === sessions.length - 1}
              previousCompleted={index > 0 && sessions[index - 1].status === 'completed'}
              celebrate={celebration?.kind === 'unlock' && celebration.sessionId === session.id}
              onPress={() => router.push(`/session/${session.id}`)}
            />
          ))}
        </View>
      </ScrollView>
      <NextSessionBar
        plan={plan.data}
        onStart={() => nextSessionId && router.push(`/session/${nextSessionId}`)}
        onRestart={restart}
        isRestarting={resetPlan.isPending}
      />
    </View>
  );
}
```

- [ ] **Step 4: Verify, then self-check**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

Run `mobile-self-check` with an onboarded user. Capture `plan.png` and `plan-dark.png` (fresh:
0 of 3). Check against decision D:
- **Foundation (open):** accent border, "Up next" chip, and an accent ring node.
- **Build and Forge (locked):** a lock node, "Unlocks after Session N", a muted title, full
  opacity, and no shadow.
- **Sticky bar:** "Next session · Foundation · 25 min · Start", sitting above the tab bar.
- **Header:** the greeting, the goal chips and a three-segment bar.
- **Pull-to-refresh:** works, and its tint follows the theme.

Tapping a card still opens the Session placeholder; Task 5 builds that screen.

- [ ] **Step 5: Record decisions and commit**

Append to `docs/decisions/plan-b.md`:

```markdown
- The open card's accent border fades in as an overlay (opacity 0 → 1) instead of interpolating colours · colours stay className tokens · none
- `greeting()`: 05–11 morning, 12–17 afternoon, otherwise evening · "Good morning" at 1 a.m. read wrong in the smoke run · none
```

```bash
git add apps/mobile docs/screenshots docs/decisions/plan-b.md
git commit -m "feat(mobile): plan timeline with sticky next-session bar and unlock motion"
```

---

### Task 5: Session detail — checklist, completion, celebration trigger

**Files:**
- Create: `src/features/session/block-row.tsx`
- Replace: `src/app/session/[id].tsx`

**Interfaces:**
- Consumes:
  - Tasks 1–4: `usePlan`, `useCompleteSession`, `useChecklist`, `NO_TICKS`,
    `usePlanCelebration`, `ScreenState`, `SubmitButton`, `Icon`, `BLOCK_LABELS`.
  - `@forge/contracts`: `SessionBlock`, `SessionId`, `SessionStatus`.
- Produces: `CheckableBlockRow { block; isTicked; onToggle }` and
  `StaticBlockRow { block; isDone }`.

- [ ] **Step 1: Block rows**

```tsx
import type { SessionBlock } from '@forge/contracts';
import { ControlField, Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import { Icon } from '@/components/icon';
import { BLOCK_LABELS } from '@/content/labels';

function BlockText({ block, muted }: { block: SessionBlock; muted: boolean }) {
  return (
    <View className="flex-1 gap-0.5">
      <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
        {BLOCK_LABELS[block.kind]}
      </Typography>
      <Typography type="body" weight="semibold" color={muted ? 'muted' : 'default'}>
        {block.title}
      </Typography>
      <Typography type="body-sm" color="muted">
        {block.detail}
      </Typography>
    </View>
  );
}

/** Open session: a tappable checklist row. */
export function CheckableBlockRow({
  block,
  isTicked,
  onToggle,
}: {
  block: SessionBlock;
  isTicked: boolean;
  onToggle: () => void;
}) {
  return (
    <ControlField
      isSelected={isTicked}
      onSelectedChange={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isTicked }}
      className="rounded-3xl bg-surface p-4"
    >
      <BlockText block={block} muted={false} />
      <ControlField.Indicator variant="checkbox" />
    </ControlField>
  );
}

/** Completed session: every block done, muted. Locked session: a read-only preview. */
export function StaticBlockRow({ block, isDone }: { block: SessionBlock; isDone: boolean }) {
  return (
    <Surface
      variant={isDone ? 'secondary' : 'default'}
      className="flex-row items-center gap-3 shadow-none"
    >
      <BlockText block={block} muted={isDone} />
      {isDone ? <Icon name="checkmark-circle" size={22} className="text-muted" /> : null}
    </Surface>
  );
}
```

- [ ] **Step 2: The session screen**

```tsx
import type { SessionBlock, SessionId, SessionStatus } from '@forge/contracts';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Chip, Typography, useToast } from 'heroui-native';
import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ScreenState } from '@/components/screen-state';
import { SubmitButton } from '@/components/submit-button';
import { useCompleteSession, usePlan } from '@/features/plan/api';
import { CheckableBlockRow, StaticBlockRow } from '@/features/session/block-row';
import { usePlanCelebration } from '@/stores/celebration-store';
import { NO_TICKS, useChecklist } from '@/stores/checklist-store';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = usePlan();
  const session = plan.data?.sessions.find((candidate) => candidate.id === id);

  if (!session || !plan.data) {
    return (
      <ScreenState
        icon="help-circle-outline"
        title="Session not found"
        body="It may have moved. Head back to your plan."
        actionLabel="Back to plan"
        onAction={() => router.back()}
      />
    );
  }

  const next = plan.data.sessions.find((candidate) => candidate.number === session.number + 1);
  const previous = plan.data.sessions.find((candidate) => candidate.number === session.number - 1);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <View className="gap-2">
          <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
            {`Session ${session.number} · ${session.durationMinutes} min`}
          </Typography>
          <Typography.Heading type="h2">{session.title}</Typography.Heading>
          <Typography type="body" color="muted">
            {session.subtitle}
          </Typography>
          <View className="flex-row">
            <StatusChip status={session.status} />
          </View>
        </View>

        {session.status === 'open' ? (
          <OpenChecklist sessionId={session.id} blocks={session.blocks} />
        ) : (
          <View className="gap-3">
            {session.blocks.map((block) => (
              <StaticBlockRow
                key={block.kind}
                block={block}
                isDone={session.status === 'completed'}
              />
            ))}
          </View>
        )}

        {session.status === 'completed' ? (
          <Typography type="body-sm" color="muted" align="center">
            Completed. Restart the plan from the Plan tab to go again.
          </Typography>
        ) : null}
        {session.status === 'locked' && previous ? (
          <Typography type="body-sm" color="muted" align="center">
            {`Unlocks after Session ${previous.number} · ${previous.title}`}
          </Typography>
        ) : null}
      </ScrollView>

      {session.status === 'open' ? (
        <CompleteBar
          sessionId={session.id}
          blockCount={session.blocks.length}
          nextTitle={next?.title}
        />
      ) : null}
    </View>
  );
}

function StatusChip({ status }: { status: SessionStatus }) {
  if (status === 'completed') {
    return (
      <Chip size="sm" variant="soft" color="success">
        Completed
      </Chip>
    );
  }
  if (status === 'open') {
    return (
      <Chip size="sm" color="accent">
        Up next
      </Chip>
    );
  }
  return (
    <Chip size="sm" variant="soft" color="default">
      Locked
    </Chip>
  );
}

function OpenChecklist({ sessionId, blocks }: { sessionId: SessionId; blocks: SessionBlock[] }) {
  const ticked = useChecklist((state) => state.ticked[sessionId] ?? NO_TICKS);
  const toggle = useChecklist((state) => state.toggle);
  return (
    <View className="gap-3">
      {blocks.map((block, index) => (
        <CheckableBlockRow
          key={block.kind}
          block={block}
          isTicked={ticked.includes(index)}
          onToggle={() => {
            void Haptics.selectionAsync();
            toggle(sessionId, index);
          }}
        />
      ))}
    </View>
  );
}

function CompleteBar({
  sessionId,
  blockCount,
  nextTitle,
}: {
  sessionId: SessionId;
  blockCount: number;
  nextTitle: string | undefined;
}) {
  const complete = useCompleteSession();
  const plan = usePlan();
  const { toast } = useToast();
  const tickedCount = useChecklist((state) => (state.ticked[sessionId] ?? NO_TICKS).length);
  const clear = useChecklist((state) => state.clear);
  const allTicked = tickedCount === blockCount;

  // A small pulse the moment the last block is ticked and the button becomes available.
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const wasAllTicked = useRef(allTicked);
  useEffect(() => {
    if (allTicked && !wasAllTicked.current && !reducedMotion) {
      scale.value = withSequence(
        withTiming(1.03, { duration: 120 }),
        withTiming(1, { duration: 160 }),
      );
    }
    wasAllTicked.current = allTicked;
  }, [allTicked, reducedMotion, scale]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const caption = !allTicked
    ? 'Tick each block as you finish it.'
    : nextTitle
      ? `Finishing unlocks ${nextTitle}.`
      : 'Finishing completes your plan.';

  const onComplete = () =>
    complete.mutate(sessionId, {
      onSuccess: (updated) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clear(sessionId);
        usePlanCelebration
          .getState()
          .celebrate(
            updated.nextSessionId
              ? { kind: 'unlock', sessionId: updated.nextSessionId }
              : { kind: 'planComplete' },
          );
        router.back();
      },
      onError: (error) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (error.code === 'SESSION_LOCKED') {
          toast.show({ variant: 'danger', label: 'This session is still locked.' });
          void plan.refetch();
        } else {
          toast.show({
            variant: 'danger',
            label: "Couldn't save. Check your connection and try again.",
          });
        }
      },
    });

  return (
    <View className="gap-3 border-t border-separator bg-background px-5 pb-safe-offset-3 pt-3">
      <Typography type="body-sm" color="muted" align="center">
        {caption}
      </Typography>
      <Animated.View style={pulseStyle}>
        <SubmitButton
          label="Complete session"
          isDisabled={!allTicked}
          isPending={complete.isPending}
          onPress={onComplete}
        />
      </Animated.View>
    </View>
  );
}
```

The root layout already titles this header's back button "Plan" (`headerBackTitle`). Without
that, iOS shows the group name "(tabs)", as the smoke run found.

- [ ] **Step 3: Verify, then self-check**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

Run `mobile-self-check`. Capture:
- `session-open.png`: the checklist, with "Complete session" disabled and the caption "Tick each
  block as you finish it.".
- `session-ready.png`: all blocks ticked. The button enables with a pulse, and the caption reads
  "Finishing unlocks Build.".
- `plan-unlocked.png`: after "Complete session", back on Plan. Build has animated to open (the
  spring and border fade in), with a success haptic followed by an impact haptic. Foundation is
  completed and muted, and the connector is filled.
- `session-locked.png`: tap Forge. A read-only preview with no checkboxes and "Unlocks after
  Session 2 · Build".
- `session-completed.png`: tap Foundation. Muted, ticked rows and "Completed. Restart the plan
  from the Plan tab to go again.".
- Not found: `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/session/nope"` shows
  "Session not found" with "Back to plan".

- [ ] **Step 4: Review Focus #2 — double tap**

On Build with all blocks ticked, tap "Complete session" twice as fast as possible.

Expected: one navigation back, one celebration (on Forge), and the header reads "2 of 3
complete", not 3. Confirm on the server:

```bash
curl -s localhost:3000/plan -H "authorization: Bearer <token>" | node -pe 'JSON.parse(require("fs").readFileSync(0)).completedCount'
```

Log in with curl to get the token. Expected: `2`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile docs/screenshots
git commit -m "feat(mobile): session checklist, completion and unlock celebration"
```

---

### Task 6: Paywall (mock purchase and restore)

**Files:**
- Create: `src/features/billing/products.ts`, `src/features/billing/product-option.tsx`
- Replace: `src/app/paywall.tsx`

**Interfaces:**
- Consumes:
  - Task 1: `usePurchase`, `useRestorePurchases`, `FormAlert`, `SubmitButton`, `Icon`,
    `COACH_BENEFITS`.
  - `@forge/contracts`: `PRODUCT_IDS`, `ProductId`.
- Produces: `ProductDisplay { id; label; price; note?; badge? }`, `PRODUCTS`, and
  `ProductOption { product; isSelected }`.

- [ ] **Step 1: Product copy and the option card**

```ts
import type { ProductId } from '@forge/contracts';

// Display copy for the two mock products. Sandbox only: nothing is ever charged.
export interface ProductDisplay {
  id: ProductId;
  label: string;
  price: string;
  note?: string;
  badge?: string;
}

export const PRODUCTS: readonly ProductDisplay[] = [
  {
    id: 'forge_plus_yearly',
    label: 'Yearly',
    price: '$59.99 / year',
    note: '$5.00 / month, billed yearly',
    badge: 'Best value',
  },
  { id: 'forge_plus_monthly', label: 'Monthly', price: '$9.99 / month' },
];
```

```tsx
import { Chip, cn, Radio, RadioGroup, Typography } from 'heroui-native';
import { View } from 'react-native';
import type { ProductDisplay } from './products';

export function ProductOption({
  product,
  isSelected,
}: {
  product: ProductDisplay;
  isSelected: boolean;
}) {
  return (
    <RadioGroup.Item
      value={product.id}
      className={cn(
        'rounded-3xl border-2 bg-surface p-4',
        isSelected ? 'border-accent' : 'border-transparent',
      )}
    >
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Typography type="body" weight="semibold">
            {product.label}
          </Typography>
          {product.badge ? (
            <Chip size="sm" color="accent">
              {product.badge}
            </Chip>
          ) : null}
        </View>
        <Typography type="body-sm">{product.price}</Typography>
        {product.note ? (
          <Typography type="body-xs" color="muted">
            {product.note}
          </Typography>
        ) : null}
      </View>
      <Radio />
    </RadioGroup.Item>
  );
}
```

- [ ] **Step 2: The paywall screen**

The "Sandbox · no real charge" chip needs `self-center`: HeroUI's `Chip` aligns itself to the
start, so a centred parent isn't enough (the smoke run showed it pinned left).

```tsx
import { PRODUCT_IDS, type ProductId } from '@forge/contracts';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Chip, CloseButton, LinkButton, RadioGroup, Typography, useToast } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FormAlert } from '@/components/form-alert';
import { Icon } from '@/components/icon';
import { SubmitButton } from '@/components/submit-button';
import { COACH_BENEFITS } from '@/content/labels';
import { usePurchase, useRestorePurchases } from '@/features/billing/api';
import { ProductOption } from '@/features/billing/product-option';
import { PRODUCTS } from '@/features/billing/products';

export default function PaywallScreen() {
  const [productId, setProductId] = useState<ProductId>('forge_plus_yearly');
  const purchase = usePurchase();
  const restore = useRestorePurchases();
  const { toast } = useToast();
  const product = PRODUCTS.find((candidate) => candidate.id === productId) ?? PRODUCTS[0];
  const error = purchase.error ?? restore.error;

  const selectProduct = (value: string) => {
    const id = PRODUCT_IDS.find((candidate) => candidate === value);
    if (!id) return;
    void Haptics.selectionAsync();
    setProductId(id);
  };

  const startTrial = () =>
    purchase.mutate(productId, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.show({ variant: 'success', label: 'Welcome to Forge Plus' });
        router.back();
      },
    });

  const restorePurchases = () =>
    restore.mutate(undefined, {
      onSuccess: (entitlement) => {
        if (entitlement.tier === 'plus') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.show({ variant: 'success', label: 'Purchases restored' });
          router.back();
        } else {
          toast.show({ label: 'No purchases to restore on this account.' });
        }
      },
    });

  return (
    <View className="flex-1 bg-background android:pt-safe">
      <ScrollView contentContainerClassName="gap-6 px-6 pb-6 pt-4">
        <View className="flex-row justify-end">
          <CloseButton onPress={() => router.back()} accessibilityLabel="Close" />
        </View>
        <View className="gap-2">
          <Typography.Heading type="h2">Forge Plus</Typography.Heading>
          <Typography type="body" color="muted">
            Your coach, on call for every session.
          </Typography>
        </View>
        <View className="gap-3">
          {COACH_BENEFITS.map((benefit) => (
            <View key={benefit} className="flex-row items-center gap-3">
              <Icon name="checkmark-circle" size={20} className="text-accent" />
              <Typography type="body-sm" className="flex-1">
                {benefit}
              </Typography>
            </View>
          ))}
        </View>
        <RadioGroup value={productId} onValueChange={selectProduct} className="gap-3">
          {PRODUCTS.map((option) => (
            <ProductOption key={option.id} product={option} isSelected={option.id === productId} />
          ))}
        </RadioGroup>
        {error ? <FormAlert message={error.message} /> : null}
      </ScrollView>

      <View className="gap-3 border-t border-separator px-6 pb-safe-offset-3 pt-4">
        <SubmitButton
          label="Start 7-day trial"
          isPending={purchase.isPending}
          onPress={startTrial}
        />
        <Typography type="body-xs" color="muted" align="center">
          {`7 days free, then ${product.price}. Cancel anytime.`}
        </Typography>
        <LinkButton onPress={restorePurchases} isDisabled={restore.isPending || purchase.isPending}>
          Restore purchases
        </LinkButton>
        <Chip size="sm" variant="soft" color="default" className="self-center">
          Sandbox · no real charge
        </Chip>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Verify, then self-check**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

Run `mobile-self-check`. Open the modal with
`xcrun simctl openurl booted "exp://127.0.0.1:8081/--/paywall"` (the Coach teaser links here
from Task 7 on). Capture:
- `paywall.png` and `paywall-dark.png`: Yearly is selected with the "Best value" chip and an
  accent border; the caption reads "7 days free, then $59.99 / year. Cancel anytime."; the
  Sandbox chip is centred.
- Selecting Monthly gives a selection haptic and changes the caption price.
- "Restore purchases" on a free account shows the toast "No purchases to restore on this
  account.", and the modal stays open.
- "Start 7-day trial" gives a success haptic, shows the toast "Welcome to Forge Plus", and
  dismisses the modal.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile docs/screenshots
git commit -m "feat(mobile): paywall with mock trial and restore"
```

---

### Task 7: Coach — teaser for free, chat for Plus

**Files:**
- Create: `src/features/coach/api.ts`, `coach-teaser.tsx`, `message-bubble.tsx`,
  `typing-indicator.tsx`, `composer.tsx`, `coach-chat.tsx`
- Replace: `src/app/(tabs)/coach.tsx`

**Interfaces:**
- Consumes:
  - Tasks 1–6: `useEntitlement`, `useMe`, `queryClient`, `queryKeys`, `apiRequest`,
    `ScreenState`, `SubmitButton`, `FormAlert`, `Icon`, `SUGGESTED_PROMPTS`, `COACH_BENEFITS`.
  - `@forge/contracts`: `coachHistoryResponseSchema`, `sendCoachMessageResponseSchema`,
    `CoachMessage`, `SendCoachMessageResponse`, `routes`.
- Produces:
  - `useCoachMessages()`, and `useSendCoachMessage()` (optimistic; on error it rolls back to
    the previous list).
  - `CoachTeaser`, `CoachChat`, `ChatSkeleton`, `MessageBubble`, `TypingIndicator`, `Composer`.

- [ ] **Step 1: Queries and building blocks**

```ts
import {
  coachHistoryResponseSchema,
  routes,
  sendCoachMessageResponseSchema,
  type CoachMessage,
  type SendCoachMessageResponse,
} from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
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
    onError: (_error, _text, context) => {
      if (context) queryClient.setQueryData(queryKeys.coachMessages, context.previous);
    },
    onSuccess: ({ message, reply }, _text, context) => {
      queryClient.setQueryData<CoachMessage[]>(queryKeys.coachMessages, [
        ...(context?.previous ?? []),
        message,
        reply,
      ]);
    },
  });
}
```

```tsx
import { router } from 'expo-router';
import { Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Icon } from '@/components/icon';
import { SubmitButton } from '@/components/submit-button';
import { COACH_BENEFITS } from '@/content/labels';

/** What a free user sees on the Coach tab: what Plus unlocks, and one way in. */
export function CoachTeaser() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow justify-center gap-8 px-6 py-safe-offset-6"
    >
      <View className="items-center gap-4">
        <View className="size-16 items-center justify-center rounded-full bg-accent-soft">
          <Icon name="sparkles" size={30} className="text-accent-soft-foreground" />
        </View>
        <View className="items-center gap-2">
          <Typography.Heading type="h3" align="center">
            Meet your coach
          </Typography.Heading>
          <Typography type="body" color="muted" align="center">
            Ask about your next session, warm-ups or fitting training into a busy day. Your coach
            knows your goals and your progress.
          </Typography>
        </View>
      </View>
      <View className="gap-3">
        {COACH_BENEFITS.map((benefit) => (
          <View key={benefit} className="flex-row items-center gap-3">
            <Icon name="checkmark-circle" size={20} className="text-accent" />
            <Typography type="body-sm" className="flex-1">
              {benefit}
            </Typography>
          </View>
        ))}
      </View>
      <SubmitButton label="Unlock Coach" onPress={() => router.push('/paywall')} />
    </ScrollView>
  );
}
```

Bubbles fade in rather than "FadeInDown": in an inverted list, a vertical entering animation
runs upside down.

```tsx
import type { CoachMessage } from '@forge/contracts';
import { cn, Typography } from 'heroui-native';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

export function MessageBubble({ message }: { message: CoachMessage }) {
  const reducedMotion = useReducedMotion();
  const fromUser = message.role === 'user';
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(220)}
      className={cn('flex-row', fromUser ? 'justify-end pl-12' : 'justify-start pr-12')}
    >
      <View className={cn('rounded-3xl px-4 py-3', fromUser ? 'bg-accent' : 'bg-surface')}>
        <Typography
          type="body"
          className={fromUser ? 'text-accent-foreground' : 'text-surface-foreground'}
        >
          {message.text}
        </Typography>
      </View>
    </Animated.View>
  );
}
```

```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay }: { delay: number }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 320 }), withTiming(0.35, { duration: 320 })),
        -1,
      ),
    );
  }, [delay, opacity, reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="size-2 rounded-full bg-muted" />;
}

/** "Coach is typing" while the reply is on its way (600–1200 ms). */
export function TypingIndicator() {
  return (
    <View className="flex-row justify-start pr-12" accessibilityLabel="Coach is typing">
      <View className="flex-row items-center gap-1.5 rounded-3xl bg-surface px-4 py-4">
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
      </View>
    </View>
  );
}
```

```tsx
import { Button, Input } from 'heroui-native';
import { View } from 'react-native';
import { Icon } from '@/components/icon';

interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function Composer({ value, onChangeText, onSend, isSending }: ComposerProps) {
  const canSend = value.trim().length > 0 && !isSending;
  return (
    <View className="flex-row items-end gap-2 border-t border-separator bg-background px-4 py-3">
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder="Message your coach"
        multiline
        maxLength={500}
        className="max-h-32 flex-1"
        accessibilityLabel="Message"
      />
      <Button isIconOnly onPress={onSend} isDisabled={!canSend} accessibilityLabel="Send message">
        <Icon name="arrow-up" size={20} className="text-accent-foreground" />
      </Button>
    </View>
  );
}
```

The chat uses keyboard-controller's `KeyboardAvoidingView` with `behavior="padding"`. It
measures its own frame, so the tab bar under it needs no manual offset.

```tsx
import * as Haptics from 'expo-haptics';
import { Avatar, Chip, SkeletonGroup, Typography } from 'heroui-native';
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { FormAlert } from '@/components/form-alert';
import { Icon } from '@/components/icon';
import { ScreenState } from '@/components/screen-state';
import { SUGGESTED_PROMPTS } from '@/content/labels';
import { useMe } from '@/features/me/api';
import { useCoachMessages, useSendCoachMessage } from './api';
import { Composer } from './composer';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

export function CoachChat() {
  const me = useMe();
  const history = useCoachMessages();
  const send = useSendCoachMessage();
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setSendError(null);
    setDraft('');
    send.mutate(trimmed, {
      onError: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setDraft(trimmed);
        setSendError('Message not sent. Check your connection and try again.');
      },
    });
  };

  if (history.isPending) return <ChatSkeleton />;
  if (!history.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't load your conversation"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void history.refetch()}
      />
    );
  }

  const messages = history.data;
  const newestFirst = [...messages].reverse();

  return (
    <View className="flex-1 bg-background pt-safe">
      <View className="gap-0.5 px-5 pb-3 pt-2">
        <Typography.Heading type="h4">Coach</Typography.Heading>
        <Typography type="body-sm" color="muted">
          Knows your goals and where you are in the plan.
        </Typography>
      </View>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {messages.length === 0 ? (
          <EmptyConversation name={me.data?.displayName ?? 'there'} onPick={submit} />
        ) : (
          <FlatList
            inverted
            data={newestFirst}
            keyExtractor={(message) => message.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListHeaderComponent={send.isPending ? <TypingIndicator /> : null}
            contentContainerClassName="gap-3 px-5 py-4"
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}
        {sendError ? (
          <View className="px-5 pb-2">
            <FormAlert message={sendError} />
          </View>
        ) : null}
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={() => submit(draft)}
          isSending={send.isPending}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

function EmptyConversation({ name, onPick }: { name: string; onPick: (prompt: string) => void }) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow justify-center gap-6 px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center gap-3">
        <Avatar size="lg" variant="soft" alt="Forge coach">
          <Avatar.Fallback>
            <Icon name="sparkles" size={24} className="text-accent" />
          </Avatar.Fallback>
        </Avatar>
        <Typography type="h5" align="center">
          {`Hi ${name}, I'm your Forge coach.`}
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          Ask me anything about your plan.
        </Typography>
      </View>
      <View className="flex-row flex-wrap justify-center gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Chip key={prompt} variant="secondary" color="default" onPress={() => onPick(prompt)}>
            {prompt}
          </Chip>
        ))}
      </View>
    </ScrollView>
  );
}

export function ChatSkeleton() {
  return (
    <View className="flex-1 bg-background px-5 pt-safe-offset-4">
      <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
        <SkeletonGroup.Item className="h-7 w-1/3 rounded-lg" />
        <SkeletonGroup.Item className="h-14 w-3/4 self-end rounded-3xl" />
        <SkeletonGroup.Item className="h-20 w-4/5 rounded-3xl" />
        <SkeletonGroup.Item className="h-14 w-2/3 self-end rounded-3xl" />
      </SkeletonGroup>
    </View>
  );
}
```

- [ ] **Step 2: The Coach tab**

```tsx
import { ScreenState } from '@/components/screen-state';
import { useEntitlement } from '@/features/billing/api';
import { ChatSkeleton, CoachChat } from '@/features/coach/coach-chat';
import { CoachTeaser } from '@/features/coach/coach-teaser';

export default function CoachScreen() {
  const entitlement = useEntitlement();
  if (entitlement.isPending) return <ChatSkeleton />;
  if (!entitlement.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't reach your coach"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void entitlement.refetch()}
      />
    );
  }
  // The server enforces the gate too (403 PLUS_REQUIRED); this only decides what to show.
  return entitlement.data.tier === 'plus' ? <CoachChat /> : <CoachTeaser />;
}
```

- [ ] **Step 3: Verify, then self-check**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

Run `mobile-self-check` with a free, onboarded user. Capture:
- `coach-teaser.png`: "Meet your coach", three benefits and "Unlock Coach". The button opens
  the paywall; buy the trial.
- `coach-empty.png`: "Hi {name}, I'm your Forge coach." and four chips.
- `coach-chat.png`: tap "What's my next session?". The user's bubble appears at once, a typing
  bubble shows for 0.6–1.2 s, and the reply names the user, the goals and "Foundation is open".
- `coach-send-error.png`: stop the API and send "Hello". The bubble rolls back, the draft
  returns to the composer, and the inline Alert reads "Message not sent. Check your connection
  and try again.". Restart the API afterwards.

**Review Focus #3:** with the software keyboard up, the composer sits directly above it, and
the newest message stays visible.

- [ ] **Step 4: Record decisions and commit**

Append to `docs/decisions/plan-b.md`:

```markdown
- Chat bubbles use FadeIn, not the spec's FadeInDown · the list is inverted, so a vertical entering animation would run upside down · a slightly flatter entrance
- The chat uses keyboard-controller's `KeyboardAvoidingView behavior="padding"` · it measures its own frame, so the tab bar needs no offsets · none
```

```bash
git add apps/mobile docs/screenshots docs/decisions/plan-b.md
git commit -m "feat(mobile): coach teaser and chat with optimistic send"
```

---

### Task 8: Settings, edit profile, delete account

**Files:**
- Create: `src/features/settings/settings-skeleton.tsx`,
  `src/features/settings/delete-account-dialog.tsx`
- Replace: `src/app/(tabs)/settings.tsx`, `src/app/profile.tsx`

**Interfaces:**
- Consumes:
  - Tasks 1–3: `useMe`, `useUpdateMe`, `useDeleteAccount`, `useEntitlement`, `signOut`,
    `formatDate`, `initials`, `APP_VERSION`, `GOAL_LABELS`, `GoalsField`, `FormScreen`,
    `FormTextField`, `FormAlert`, `SubmitButton`, `Icon`.
  - `@forge/contracts`: `onboardingBodySchema` (`.pick({ displayName: true, goals: true })`).
- Produces: `DeleteAccountDialog { isOpen; onOpenChange }` and `SettingsSkeleton`.

- [ ] **Step 1: Skeleton and the delete dialog**

```tsx
import { SkeletonGroup } from 'heroui-native';
import { View } from 'react-native';

export function SettingsSkeleton() {
  return (
    <View className="flex-1 bg-background px-5 pt-safe-offset-4">
      <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
        <SkeletonGroup.Item className="h-9 w-1/3 rounded-lg" />
        <SkeletonGroup.Item className="h-20 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-32 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-16 w-full rounded-3xl" />
      </SkeletonGroup>
    </View>
  );
}
```

```tsx
import { Button, Dialog } from 'heroui-native';
import { View } from 'react-native';
import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { useDeleteAccount } from '@/features/me/api';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeleteAccountDialog({ isOpen, onOpenChange }: DeleteAccountDialogProps) {
  // On success the hook signs out: the guard leaves Settings and a toast confirms the deletion.
  const deleteAccount = useDeleteAccount();
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <View className="mb-5 gap-1.5">
            <Dialog.Title>Delete your account?</Dialog.Title>
            <Dialog.Description>
              {
                "This permanently deletes your profile, plan progress, coach history and membership. This can't be undone."
              }
            </Dialog.Description>
          </View>
          {deleteAccount.error ? (
            <View className="mb-4">
              <FormAlert message={deleteAccount.error.message} />
            </View>
          ) : null}
          <View className="gap-3">
            <SubmitButton
              label="Delete everything"
              variant="danger"
              isPending={deleteAccount.isPending}
              onPress={() => deleteAccount.mutate()}
            />
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
```

- [ ] **Step 2: Settings and Edit profile**

```tsx
import { router } from 'expo-router';
import { Avatar, ListGroup, Separator, Typography } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Icon } from '@/components/icon';
import { GOAL_LABELS } from '@/content/labels';
import { useEntitlement } from '@/features/billing/api';
import { useMe } from '@/features/me/api';
import { DeleteAccountDialog } from '@/features/settings/delete-account-dialog';
import { SettingsSkeleton } from '@/features/settings/settings-skeleton';
import { APP_VERSION } from '@/lib/config';
import { formatDate, initials } from '@/lib/format';
import { signOut } from '@/lib/session';

export default function SettingsScreen() {
  const me = useMe();
  const entitlement = useEntitlement();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!me.data) return <SettingsSkeleton />;
  const user = me.data;
  const plus = entitlement.data?.tier === 'plus' ? entitlement.data : null;

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-5 pb-10 pt-safe-offset-4"
      >
        <Typography.Heading type="h2">Settings</Typography.Heading>

        <View className="flex-row items-center gap-4">
          <Avatar size="lg" variant="soft" alt={user.displayName ?? user.email}>
            <Avatar.Fallback>{initials(user.displayName, user.email)}</Avatar.Fallback>
          </Avatar>
          <View className="flex-1 gap-0.5">
            <Typography type="h5" numberOfLines={1}>
              {user.displayName ?? 'Forge member'}
            </Typography>
            <Typography type="body-sm" color="muted" numberOfLines={1}>
              {user.email}
            </Typography>
          </View>
        </View>

        <Section title="Profile">
          <ListGroup>
            <ListGroup.Item onPress={() => router.push('/profile')}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Name</ListGroup.ItemTitle>
                <ListGroup.ItemDescription numberOfLines={1}>
                  {user.displayName}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push('/profile')}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Goals</ListGroup.ItemTitle>
                <ListGroup.ItemDescription numberOfLines={1}>
                  {user.goals.map((goal) => GOAL_LABELS[goal].title).join(', ')}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>
        </Section>

        <Section title="Privacy">
          <ListGroup>
            <ListGroup.Item disabled>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Data consent</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {user.consentAcceptedAt
                    ? `Accepted ${formatDate(user.consentAcceptedAt)}`
                    : 'Not given'}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Icon name="shield-checkmark-outline" size={20} className="text-muted" />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </Section>

        <Section title="Membership">
          <ListGroup>
            {plus ? (
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>Forge Plus</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {plus.trialEndsAt
                      ? `Trial ends ${formatDate(plus.trialEndsAt, { withYear: false })}`
                      : 'Active'}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <Icon name="sparkles" size={20} className="text-accent" />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            ) : (
              <ListGroup.Item onPress={() => router.push('/paywall')}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>Free</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>See Forge Plus</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            )}
          </ListGroup>
        </Section>

        <Section title="Account">
          <ListGroup>
            <ListGroup.Item onPress={() => void signOut()}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Log out</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => setIsDeleteOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className="text-danger">
                  Delete account & data
                </ListGroup.ItemTitle>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>
        </Section>

        <Typography type="body-xs" color="muted" align="center">
          {`Forge ${APP_VERSION}`}
        </Typography>
      </ScrollView>
      <DeleteAccountDialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Typography type="body-xs" color="muted" className="px-1 uppercase tracking-wider">
        {title}
      </Typography>
      {children}
    </View>
  );
}
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingBodySchema } from '@forge/contracts';
import { router } from 'expo-router';
import { useToast } from 'heroui-native';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useMe, useUpdateMe } from '@/features/me/api';
import { GoalsField } from '@/features/profile/goals-field';

// Same rules as onboarding, minus consent (which is given once).
const profileSchema = onboardingBodySchema.pick({ displayName: true, goals: true });
type ProfileForm = z.input<typeof profileSchema>;
type ProfileBody = z.output<typeof profileSchema>;

export default function ProfileScreen() {
  const me = useMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ProfileForm, unknown, ProfileBody>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: me.data?.displayName ?? '', goals: me.data?.goals ?? [] },
  });
  const submit = handleSubmit((body) =>
    updateMe.mutate(body, {
      onSuccess: () => {
        toast.show({ variant: 'success', label: 'Profile updated' });
        router.back();
      },
    }),
  );

  return (
    <FormScreen hasHeader>
      {updateMe.error ? <FormAlert message={updateMe.error.message} /> : null}
      <FormTextField
        control={control}
        name="displayName"
        label="Name"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
      />
      <GoalsField control={control} name="goals" />
      <SubmitButton
        label="Save changes"
        isDisabled={!isDirty}
        isPending={updateMe.isPending}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}
```

- [ ] **Step 3: Verify, then self-check**

Run the verification recipe.
Expected: no type errors, 0 lint problems, `Exported: …`.

Run `mobile-self-check`. Capture:
- `settings.png` (a Plus user) and `settings-dark.png`:
  - avatar initials, name and email;
  - Name and Goals rows with chevrons;
  - "Data consent — Accepted {date}";
  - "Forge Plus — Trial ends {d MMM}";
  - "Log out" and "Delete account & data" in danger.
- `profile.png`: from the Name row. "Save changes" stays disabled until something changes.
  Saving shows "Profile updated" and goes back, and the Plan chips update.
- `delete-dialog.png`: the Dialog copy and "Delete everything". Confirming lands on sign-in
  with the toast "Your account and data were deleted.". Signing in again with those
  credentials shows "Email or password is incorrect.".
- "Log out" returns to sign-in immediately.

- [ ] **Step 4: Review Focus #5 — long name, all goals**

In Edit profile, set the name to `Maximilian-Alexander Featherstonehaugh` (38 characters) and
select all three goals.

Expected:
- The Plan greeting wraps to at most two lines.
- The three chips wrap onto a second row.
- The Settings Name and Goals rows truncate with an ellipsis.

Capture `plan-long-name.png`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile docs/screenshots
git commit -m "feat(mobile): settings, edit profile and account deletion"
```

---

### Task 9: Final walkthrough, READMEs, final gate

**Files:**
- Create: `apps/mobile/README.md`
- Modify: `README.md` (root: Screenshots and "What I'd change with one more hour"),
  `docs/decisions/plan-b.md`, `docs/screenshots/*`

**Interfaces:**
- Consumes: the whole app, the API (Plan A) and the running docker-compose Postgres.
- Produces: the reviewer-facing documentation and the final screenshot set.

- [ ] **Step 1: Full walkthrough on an iPhone 16 simulator, as a brand-new user**

Walk the whole flow:
1. Sign up.
2. Onboard (two goals).
3. Complete Foundation, Build and Forge in order.
4. Check the Plan complete card (`plan-complete.png`) and the "Restart plan" bar; restart, and
   Foundation replays the unlock motion.
5. Open Coach, then the paywall, and start the trial.
6. Chat.
7. Open Settings and delete the account.

Every screen must match the UI bar in `.claude/rules/mobile.md` in light and dark. Fix anything
that doesn't, and re-shoot.

- [ ] **Step 2: Dark mode set**

Re-shoot `plan-dark.png`, `coach-chat-dark.png` and `settings-dark.png` with the final code
(`xcrun simctl ui booted appearance dark`). Switch back to `light` afterwards.

- [ ] **Step 3: Review Focus #1 — cold relaunch with the API down**

Use a signed-in, onboarded user who has completed one session.

1. Stop the API.
2. Run `xcrun simctl terminate booted host.exp.Exponent`.
3. Reopen with `xcrun simctl openurl booted exp://127.0.0.1:8081`.

Expected:
- The splash gives way straight to the cached plan (1 of 3). There is no skeleton and no error
  flash.
- Pull-to-refresh ends quietly, and the cached content stays.

Start the API again; the next foreground or pull-to-refresh re-syncs.

- [ ] **Step 4: Review Focus #4 — the session ends on the server**

1. Sign in as user A in the app.
2. From a terminal, log in as A with curl and call `DELETE /me` with that token.
3. In the app, pull to refresh on Plan.

Expected: the app returns to sign-in with the toast "Your session ended. Please sign in
again.". Sign up as user B: the Plan shows 0 of 3, B's own name and nothing of A's.

- [ ] **Step 5: Android**

Run: `emulator -list-avds`. If an AVD is listed:
1. Run the app there with `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` in `apps/mobile/.env`.
2. Repeat the walkthrough's first three screens.
3. Note the result.

If none is listed (as on the machine this plan was written on), say so in
`apps/mobile/README.md`.

- [ ] **Step 6: Write `apps/mobile/README.md`**

````markdown
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
  not onboarded → `onboarding`; otherwise → `(tabs)` (Plan · Coach · Settings), plus
  `session/[id]`, `profile` and the `paywall` modal.
- **Server state:** TanStack Query. Only `me` and `plan` persist (AsyncStorage), so a cold
  launch paints instantly and then re-syncs. Every response is parsed with the
  `@forge/contracts` schema.
- **Client state:** Zustand. The JWT lives in SecureStore; checklist ticks and the pending
  unlock celebration live in memory. Signing out wipes the token, both caches and the stores.
- **UI:** HeroUI Native components, with colour and spacing only from theme tokens
  (className). Light/dark follows the system. Reanimated handles motion (with Reduce Motion
  respected) and expo-haptics handles haptics.

## Verified on

- iPhone 16 simulator (iOS 18.4), Expo Go SDK 57, light and dark.
- Android: not verified locally: there was no Android emulator (AVD) on the development
  machine. Point `EXPO_PUBLIC_API_URL` at `http://10.0.2.2:3000` to try it.

Screenshots: [`docs/screenshots/`](../../docs/screenshots/). Decisions:
[`docs/decisions/plan-b.md`](../../docs/decisions/plan-b.md).
````

If Step 5 did run the app on an AVD, replace the Android line with:
`- Android emulator (<the AVD name printed by emulator -list-avds>), Expo Go SDK 57: sign-in,
onboarding and Plan checked in light and dark.`

- [ ] **Step 7: Finish the root README**

Add a `## Screenshots` section after `## Tests`: a two-column Markdown table of
`docs/screenshots/` images (light: sign-in, onboarding, plan, session-ready, coach-chat,
paywall, settings; dark: plan-dark, coach-chat-dark).

Then add, as the last section, `## What I'd change with one more hour`, with **three concrete UI
items you actually observed** during Steps 1–4. Each item gets one sentence on what it is and
one on why. Candidates noticed while this plan was being validated (use them only if they're
still true):
- In dark mode, the sticky bar and the cards lose their elevation, because surface shadows are
  transparent; they need a hairline border.
- The Coach typing indicator shows no "Coach is thinking…" label for screen readers beyond the
  accessibility label.
- The plan-complete moment deserves a stronger celebration than a fade-in card.

Also add, under `## Tests`: "Mobile: no automated tests by design (TDD exemption). Each screen
was checked in the iOS Simulator; see the screenshots."

- [ ] **Step 8: Final gate**

Run: `pnpm i && pnpm build && pnpm typecheck && pnpm lint && pnpm test`
Expected: all green.

Run: `docker compose up -d --wait && pnpm db:push && pnpm test:e2e`
Expected: 5 suites, 16 tests pass.

Run: `ls docs/screenshots`
Expected: every file named in Tasks 2–9, and no placeholder screenshots.

- [ ] **Step 9: Record decisions and commit**

Append to `docs/decisions/plan-b.md` any rulings made during the walkthrough (for example, a
fix you chose not to make; the `mobile-self-check` skill requires it). Then:

```bash
git add apps/mobile README.md docs/screenshots docs/decisions/plan-b.md
git commit -m "docs(mobile): walkthrough screenshots, readmes and final polish"
```
