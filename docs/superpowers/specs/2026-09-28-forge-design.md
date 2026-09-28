# Forge — Design Spec

- **Date:** 2026-09-28 · **Status:** draft for review
- **Inputs:** `CLAUDE.md`, `docs/product.md` (scope, rules, API surface, decisions A–D — final),
  `.claude/rules/{contracts,api,mobile,git}.md`. Once approved, this file is the authority;
  `docs/product.md` stays as the product brief.
- **Decision references:** A–D are the product decisions in `docs/product.md`; D1–D33 are the
  rulings made in this spec (§13).

## 1. Intent

Take-home for a Senior Full-Stack (React Native / Node) role. Reviewers judge UI taste and
whether the author can explain any file; architecture and coverage are not graded. Success is a
small, finished, explainable slice:

- A reviewer follows the README and, within minutes, signs up on an iPhone simulator, onboards,
  completes the three sessions in order, restarts, hits the paywall, "buys" Plus, chats with the
  coach, and deletes the account.
- Plan order is enforced by the server; progress survives a cold launch (instant paint from the
  persisted cache, then re-sync).
- Every screen looks finished in light and dark on an iPhone 15/16 simulator (UI bar in
  `.claude/rules/mobile.md`).
- Every API domain service was built red → green → refactor; four e2e flows run against the
  docker-compose Postgres.

Cut order if time runs out (unchanged): paywall → coach → settings. Never cut auth, plan
lock/unlock that survives reload, or the Plan screen.

**Non-goals:** password reset, email verification, refresh tokens, real payments / StoreKit,
streaming replies, push notifications, offline writes, i18n, web target, analytics, CI, API
container image, mobile automated tests.

## 2. Stack, versions, dependencies

Verified against npm on 2026-09-28.

| Area | Choice | Why this version |
|---|---|---|
| Runtime | Node 24 (`.nvmrc`); pnpm **10.34.5** pinned via root `packageManager` | corepack resolves pnpm 12 when unpinned (D3) |
| Monorepo | Turborepo 2.x, pnpm workspaces, `nodeLinker: hoisted` | CLAUDE.md |
| TypeScript | **~6.0.3** in every package | Expo 57 template pin; TS 7 is outside ts-jest and typescript-eslint ranges (D4) |
| Contracts | zod 4.x | rules |
| API | NestJS **11.2.x** (npm `legacy` tag), @nestjs/jwt 11, drizzle-orm 0.45 + drizzle-kit 0.31, postgres (postgres.js) 3.4, bcryptjs 3, Jest 30 + ts-jest 29 + supertest 7 | rules pin Nest 11; npm `latest` is 12 (D2) |
| Database | Postgres 16 via docker-compose | rules |
| Mobile | Expo SDK **57** (RN 0.86.3, React 19.2.3), Expo Router 57, HeroUI Native 1.0.x, Uniwind 1.x, Tailwind 4.x | "latest stable SDK" (D1) |

Native-module versions are never hand-picked: `npx expo install <pkg>` resolves the SDK 57 set
(reanimated 4.5.1, worklets 0.10.1, gesture-handler ~2.32, safe-area-context ~5.7, screens
~4.26, svg 15.15.4, async-storage 2.2.0, keyboard-controller 1.21.9). All run in Expo Go.

**Approved dependency set** (anything else: ask first, per CLAUDE.md):

- **root (dev):** turbo, prettier.
- **contracts:** zod · dev: typescript.
- **api:** @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/jwt (all 11),
  reflect-metadata, rxjs, drizzle-orm, postgres, bcryptjs, zod, @forge/contracts · dev:
  @nestjs/cli, @nestjs/schematics, @nestjs/testing (11), drizzle-kit, jest, ts-jest, @types/jest,
  supertest, @types/supertest, @types/node, typescript, and the ESLint/Prettier toolchain that
  `nest new` generates.
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

## 3. Repository layout

```
.
├─ package.json            private · packageManager pnpm@10.34.5 · engines.node ">=24 <25"
├─ pnpm-workspace.yaml     packages apps/*, packages/* · nodeLinker: hoisted · onlyBuiltDependencies
├─ turbo.json
├─ docker-compose.yml      postgres:16, healthcheck, volume; docker/postgres/init.sql creates forge_test
├─ .prettierrc · .gitignore (list from .claude/rules/git.md) · README.md
├─ packages/contracts/     @forge/contracts
├─ apps/api/               @forge/api
├─ apps/mobile/            @forge/mobile
└─ docs/                   product.md · decisions/ · screenshots/ · superpowers/specs/
```

- **Root scripts:** `dev:api` and `dev:mobile` build contracts once, then run
  `pnpm --filter <app> dev` (keeps Expo's interactive CLI out of turbo's TUI, D29). `build`,
  `test`, `test:e2e`, `typecheck` and `lint` each run `turbo run <task>`. `db:push` forwards to
  the API.
- **turbo tasks:** `build` (dependsOn `^build`, outputs `dist/**`); `test` and `typecheck`
  (dependsOn `^build`); `test:e2e` (dependsOn `^build`, no cache); `lint`.
- **pnpm 10** blocks dependency build scripts by default. List the ones that must run under
  `onlyBuiltDependencies` in `pnpm-workspace.yaml`; never use the interactive
  `pnpm approve-builds`.

## 4. Contracts — `@forge/contracts` (frozen once Plan 0 is on main)

Build: `tsc` → `dist/` as CommonJS + `.d.ts`; `exports: { ".": { "types", "default" } }` plus
`main`/`types`; `dev` = `tsc --watch`. `src/index.ts` re-exports every module. Nothing else is
shared between apps.

### 4.1 `src/domain.ts`

```ts
export const GOALS = ['get_stronger', 'move_daily', 'build_habit'] as const;
export type Goal = (typeof GOALS)[number];

export const SESSION_IDS = ['foundation', 'build', 'forge'] as const;
export type SessionId = (typeof SESSION_IDS)[number];

export const SESSION_STATUSES = ['completed', 'open', 'locked'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const BLOCK_KINDS = ['warm_up', 'main_set', 'finisher', 'cool_down'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const ENTITLEMENT_TIERS = ['free', 'plus'] as const;
export type EntitlementTier = (typeof ENTITLEMENT_TIERS)[number];

export const PRODUCT_IDS = ['forge_plus_monthly', 'forge_plus_yearly'] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export const COACH_ROLES = ['user', 'coach'] as const;
export type CoachRole = (typeof COACH_ROLES)[number];

export const ERROR_CODES = [
  'VALIDATION_FAILED', 'UNAUTHORIZED', 'INVALID_CREDENTIALS', 'PLUS_REQUIRED', 'NOT_FOUND',
  'SESSION_NOT_FOUND', 'EMAIL_TAKEN', 'SESSION_LOCKED', 'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// Timestamps cross the wire as ISO 8601 strings.
export interface User {
  id: string;                       // uuid; JWT `sub`
  email: string;                    // lowercased
  displayName: string | null;
  goal: Goal | null;
  consentAcceptedAt: string | null;
  onboarded: boolean;               // displayName && goal && consentAcceptedAt, computed by the API
}

export interface SessionBlock { kind: BlockKind; title: string; detail: string }

export interface PlanSession {
  id: SessionId;
  number: number;                   // 1-based position in the plan
  title: string;
  subtitle: string;
  durationMinutes: number;
  blocks: SessionBlock[];
  status: SessionStatus;
}

export interface PlanView {
  sessions: PlanSession[];          // template order
  completedCount: number;           // 0..totalCount
  totalCount: number;
  nextSessionId: SessionId | null;  // the open session; null when the plan is complete
}

export interface CoachMessage { id: string; role: CoachRole; text: string; createdAt: string }

export interface Entitlement {
  tier: EntitlementTier;
  productId: ProductId | null;      // null when free
  trialEndsAt: string | null;       // null when free
}

export interface ApiError { code: ErrorCode; message: string }
```

### 4.2 `src/schemas/*.ts` (zod v4)

Validation messages are user-facing copy: the API returns them in 400 bodies and the mobile
forms show them inline. Body and wrapper response types are inferred (`z.infer`). Schemas for
domain types are declared `satisfies z.ZodType<DomainType>`. Timestamps are `z.iso.datetime()`.

| File | Export | Shape and messages |
|---|---|---|
| `auth.ts` | `emailSchema` | string → trim → lowercase → valid email, ≤ 254 — "Enter a valid email address." |
| | `newPasswordSchema` | 8–72 chars and ≤ 72 UTF-8 bytes (bcrypt) — "Use at least 8 characters." / "Use 72 characters or fewer." |
| | `signupBodySchema` → `SignupBody` | `{ email: emailSchema, password: newPasswordSchema }` |
| | `loginBodySchema` → `LoginBody` | `{ email: emailSchema, password: string ≥ 1 }` — "Enter your password." |
| | `authResponseSchema` → `AuthResponse` | `{ token: string, user: userSchema }` |
| `me.ts` | `displayNameSchema` | trim, 1–40 — "Tell us what to call you." / "Keep it under 40 characters." |
| | `goalSchema` | `z.enum(GOALS)` — "Pick a goal." |
| | `userSchema` | `satisfies z.ZodType<User>` |
| | `updateMeBodySchema` → `UpdateMeBody` | `{ displayName?, goal?, acceptConsent?: z.literal(true) }`, at least one key — "Nothing to update." |
| | `onboardingBodySchema` → `OnboardingBody` | all three required; `acceptConsent: z.literal(true)` — "Please accept to continue." (the mobile onboarding form; any value is a valid `UpdateMeBody`) |
| `plan.ts` | `sessionIdSchema`, `sessionBlockSchema`, `planSessionSchema`, `planViewSchema` | `planViewSchema satisfies z.ZodType<PlanView>` |
| `coach.ts` | `coachMessageSchema` | `satisfies z.ZodType<CoachMessage>` |
| | `sendCoachMessageBodySchema` → `SendCoachMessageBody` | `{ text }`, trim, 1–500 — "Type a message first." / "Keep it under 500 characters." |
| | `coachHistoryResponseSchema` → `CoachHistoryResponse` | `{ messages: CoachMessage[] }` |
| | `sendCoachMessageResponseSchema` → `SendCoachMessageResponse` | `{ message: CoachMessage, reply: CoachMessage }` |
| `billing.ts` | `entitlementSchema` | `satisfies z.ZodType<Entitlement>` |
| | `mockPurchaseBodySchema` → `MockPurchaseBody` | `{ productId: z.enum(PRODUCT_IDS) }` — "Choose a plan." |
| `error.ts` | `apiErrorSchema` | `satisfies z.ZodType<ApiError>` (the mobile app parses error bodies with it) |

### 4.3 `src/routes.ts`

```ts
export const routes = {
  auth: { signup: '/auth/signup', login: '/auth/login' },
  me: '/me',
  plan: {
    get: '/plan',
    complete: (id: string) => `/plan/sessions/${id}/complete`,
    reset: '/plan/reset',
  },
  coach: { messages: '/coach/messages' },
  billing: {
    entitlement: '/billing/entitlement',
    mockPurchase: '/billing/mock-purchase',
    mockRestore: '/billing/mock-restore',
  },
} as const;
```

API controllers use `@Controller()` with no prefix, and each handler decorator takes these
constants (`@Post(routes.plan.complete(':id'))`), so the two apps cannot drift. No global
prefix.

### 4.4 Smoke test

`packages/contracts/test/smoke.test.cjs` uses `node:test`, so no framework dependency (D30). For
each of `apps/api` and `apps/mobile`, it resolves `@forge/contracts` from that directory
(`require.resolve(..., { paths: [appDir] })`), requires it, parses a `PlanView` fixture with
`planViewSchema`, and checks `routes.plan.complete('build')`. Runs in `pnpm test`, after
`build`.

## 5. Data model

Postgres 16. The Drizzle schema lives in `apps/api/src/db/schema.ts`. Postgres enums (`goal`,
`product_id`, `coach_role`) are built from the contracts tuples, so database and wire values
cannot drift. The schema is applied with `drizzle-kit push` for dev and e2e; there are no
migration files (D17).

**`users`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK, default `gen_random_uuid()` | JWT `sub` |
| `email` | text, not null, unique | already lowercased by `emailSchema` |
| `password_hash` | text, not null | bcryptjs, cost 10 |
| `display_name` | text, null | |
| `goal` | `goal` enum, null | |
| `consent_accepted_at` | timestamptz, null | set once (D33) |
| `completed_count` | integer, not null, default 0, check ≥ 0 | decision A; the only plan state |
| `created_at` | timestamptz, not null, default now() | |

**`coach_messages`** — index `(user_id, id)`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint generated always as identity, PK | order = insertion order (D12); sent as a string |
| `user_id` | uuid, not null → `users.id` on delete cascade | |
| `role` | `coach_role` enum, not null | |
| `text` | text, not null | |
| `created_at` | timestamptz, not null, default now() | |

**`entitlements`** — a row exists ⇔ the user has Plus (D9)

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK → `users.id` on delete cascade | |
| `product_id` | `product_id` enum, not null | |
| `trial_ends_at` | timestamptz, not null | set on first purchase only |
| `purchased_at` | timestamptz, not null, default now() | |

Deleting the `users` row deletes everything the user owns: plan progress is on the row, and
messages and entitlements cascade. There are no per-session rows (decision A).

## 6. API — `apps/api`

### 6.1 Module shape

Each module has `*.controller.ts` (HTTP only: pipe-validated input, `userId` from the guard,
returns a contract type) → `*.service.ts` (domain rules; throws `AppError`) →
`*.repository.ts` (port interface + DI token) → `*.drizzle.ts` (adapter). In-memory adapters
live in `apps/api/test/in-memory/`. Unit specs sit next to their services.

| Module | Service API | Port | Uses |
|---|---|---|---|
| users | `getMe(userId)` → User · `updateMe(userId, body)` → User · `deleteMe(userId)` | `UsersRepository`: `create`, `findByEmail`, `findById`, `update`, `delete` | — |
| auth | `signup(body)` → AuthResponse · `login(body)` → AuthResponse | `UsersRepository` (exported by users) | users |
| plan | `getPlan(userId)` · `complete(userId, id)` · `reset(userId)` → PlanView | `PlanRepository`: `getCompletedCount`, `advanceFrom(userId, expected)` → number, `reset` | — |
| billing | `get(userId)` · `purchase(userId, productId)` · `restore(userId)` → Entitlement | `BillingRepository`: `find`, `upsert` | — |
| coach | `history(userId)` → CoachMessage[] · `send(userId, text)` → `{ message, reply }` | `CoachRepository`: `listRecent(userId, limit)`, `append(userId, role, text)` | users, plan, billing |

Cross-cutting code, none of which is an extra layer:

- `src/common/`: `AppError(code, message)`, the global `HttpErrorFilter`,
  `ZodValidationPipe(schema)`, and `config.ts`.
- `src/db/`: `DbModule` provides a `DB` token and closes the postgres.js pool on shutdown.
- `src/auth/`: `JwtAuthGuard` registered as `APP_GUARD`, `@Public()`, and `@CurrentUserId()`.

### 6.2 Endpoints

| Endpoint | Auth | Body schema | Success | Errors |
|---|---|---|---|---|
| `POST /auth/signup` | public | `signupBodySchema` | 201 AuthResponse | 400, 409 EMAIL_TAKEN |
| `POST /auth/login` | public | `loginBodySchema` | 200 AuthResponse | 400, 401 INVALID_CREDENTIALS |
| `GET /me` | bearer | — | 200 User | 401 |
| `PATCH /me` | bearer | `updateMeBodySchema` | 200 User | 400, 401 |
| `DELETE /me` | bearer | — | 204 | 401 |
| `GET /plan` | bearer | — | 200 PlanView | 401 |
| `POST /plan/sessions/:id/complete` | bearer | — | 200 PlanView | 401, 404 SESSION_NOT_FOUND, 409 SESSION_LOCKED |
| `POST /plan/reset` | bearer | — | 200 PlanView | 401 |
| `GET /coach/messages` | bearer | — | 200 CoachHistoryResponse | 401, 403 PLUS_REQUIRED |
| `POST /coach/messages` | bearer | `sendCoachMessageBodySchema` | 201 SendCoachMessageResponse | 400, 401, 403 PLUS_REQUIRED |
| `GET /billing/entitlement` | bearer | — | 200 Entitlement | 401 |
| `POST /billing/mock-purchase` | bearer | `mockPurchaseBodySchema` | 200 Entitlement | 400, 401 |
| `POST /billing/mock-restore` | bearer | — | 200 Entitlement | 401 |

### 6.3 Errors

The body is always `{ code, message }`. The filter maps:

| Code | Status | When |
|---|---|---|
| VALIDATION_FAILED | 400 | body fails its schema (message = first issue's message), malformed JSON |
| UNAUTHORIZED | 401 | missing, invalid or expired token, or the token's user no longer exists |
| INVALID_CREDENTIALS | 401 | login mismatch — "Email or password is incorrect." |
| PLUS_REQUIRED | 403 | coach endpoints on the free tier — "Coach is part of Forge Plus." |
| NOT_FOUND | 404 | unknown route |
| SESSION_NOT_FOUND | 404 | unknown session id (D8) |
| EMAIL_TAKEN | 409 | signup with an existing email — "An account with this email already exists." |
| SESSION_LOCKED | 409 | completing a locked session — "Finish {open session's title} first." |
| INTERNAL | 500 | anything else — "Something went wrong." (details go to the server log only) |

Nest's own `HttpException`s map by status: 400 → VALIDATION_FAILED, 401 → UNAUTHORIZED, 404 →
NOT_FOUND, anything else → INTERNAL.

### 6.4 Auth and users

- **Signup:** email unique — pre-check, plus the adapter maps a unique-violation to
  EMAIL_TAKEN for races. bcryptjs cost 10. Returns token + user (`onboarded: false`).
- **Login:** an unknown email and a wrong password both return INVALID_CREDENTIALS. An unknown
  email still runs a bcrypt compare against a fixed dummy hash (D15).
- **JWT:** HS256, payload `{ sub: userId }`, 30-day expiry, secret `JWT_SECRET`. No refresh
  tokens; logout is client-side (D14).
- **Guard:** every non-`@Public()` route requires `Authorization: Bearer <jwt>`. The token must
  verify and `sub` must still exist, so a deleted account's token gets 401.
- **`PATCH /me`:**
  - Applies the fields provided.
  - `acceptConsent: true` sets `consentAcceptedAt = now()` only when it is null. It is never
    overwritten and cannot be revoked; deleting the account is the revocation path (D33).
- **`DELETE /me`:** deletes the `users` row; the rest cascades.

### 6.5 Plan (decision A)

The template lives in `src/plan/plan.template.ts` (content in §9.1) and ships in full in
`GET /plan` (D6). For count `c` and template index `i`: `i < c` completed, `i == c` open,
`i > c` locked; `nextSessionId = template[c]?.id ?? null`.

`complete(userId, id)`:

1. Unknown id → 404 SESSION_NOT_FOUND.
2. `i < c` → 200 with the unchanged view (idempotent no-op).
3. `i > c` → 409 SESSION_LOCKED.
4. `i == c` → `advanceFrom(userId, i)`: `UPDATE users SET completed_count = completed_count + 1
   WHERE id = $1 AND completed_count = $2 RETURNING completed_count`. If no row changed, re-read:
   a concurrent duplicate already advanced it (D7). → 200 with the new view.

`reset` sets the count to 0 → 200 view.

### 6.6 Coach

- Both endpoints call `billing.get(userId)` first; a free user gets 403 PLUS_REQUIRED (D11).
- **`history`:** the last 100 messages, oldest first (D12).
- **`send`:**
  1. Append the user message.
  2. Build the reply with `composeCoachReply(context, text)` — pure and deterministic, §9.2.
     Context: `displayName`, `goal`, `completedCount`, `totalCount`, and the next session's
     title, duration and block count, taken from `PlanService.getPlan`.
  3. `await delay()`.
  4. Append the coach message.
  5. Respond 201 `{ message, reply }`.
- **`delay`** is injected through the `COACH_DELAY` token: a uniform random wait in
  `[COACH_LATENCY_MIN_MS, COACH_LATENCY_MAX_MS]` (defaults 600 / 1200). Unit tests inject a
  no-op; e2e sets both env vars to 0 (D13).

### 6.7 Billing (mock)

- **`get`:** no row → `{ tier: 'free', productId: null, trialEndsAt: null }`; row →
  `{ tier: 'plus', productId, trialEndsAt }`.
- **`purchase(productId)`:** the first purchase inserts the row with `trialEndsAt = now + 7
  days`. A later purchase switches `productId` and keeps `trialEndsAt` (one trial per account).
- **`restore`:** returns `get()`. In production, restore re-validates store receipts
  server-side. In the mock the record already lives on the server, so restore re-reads it, and
  the client reports "nothing to restore" when the tier is still free (D10).

### 6.8 Config and runtime

- `src/config.ts` parses env with zod at boot and fails fast: `DATABASE_URL`, `JWT_SECRET` (≥ 32
  chars), `PORT` (3000), `COACH_LATENCY_MIN_MS` (600), `COACH_LATENCY_MAX_MS` (1200). e2e also
  reads `TEST_DATABASE_URL`.
- `main.ts` calls `process.loadEnvFile()` when `.env` exists (D16), listens on `0.0.0.0` so
  devices on the LAN can reach it, and enables shutdown hooks.
- postgres.js runs with `prepare: false` when the URL targets a Supabase transaction pooler
  (port 6543).
- `apps/api/.env.example` points at docker-compose:
  `postgres://forge:forge@localhost:5432/forge` and `…/forge_test`.

## 7. Mobile architecture — `apps/mobile`

### 7.1 Routes and guards (Expo Router, `src/app`)

```
src/app/
├─ _layout.tsx          providers · boot gate · root Stack with Stack.Protected · ErrorBoundary
├─ (auth)/_layout.tsx   Stack, headers hidden
│  ├─ sign-in.tsx
│  └─ sign-up.tsx
├─ onboarding.tsx
├─ (tabs)/_layout.tsx   Tabs: Plan · Coach · Settings (Ionicons); prefetches ['entitlement']
│  ├─ index.tsx         Plan
│  ├─ coach.tsx
│  └─ settings.tsx
├─ session/[id].tsx     pushed over the tabs
├─ profile.tsx          edit name + goal
└─ paywall.tsx          presentation: 'modal'
```

Root `Stack.Protected` guards:

| Guard | Screens |
|---|---|
| no token | `(auth)` |
| token and `me.onboarded === false` | `onboarding` |
| token and `me.onboarded` | `(tabs)`, `session/[id]`, `profile`, `paywall` |

**Boot:** the native splash is held (`SplashScreen.preventAutoHideAsync`) until the session
store has hydrated from SecureStore and the query cache has been restored. If a token exists but
no `me` is cached, the splash stays until `GET /me` settles. On failure, the app shows a
full-screen ScreenState ("Can't reach Forge", "Try again") instead of the Stack.

### 7.2 Providers and setup

- **Provider order (outer → inner):** `GestureHandlerRootView` → `KeyboardProvider` →
  `HeroUINativeProvider` → `PersistQueryClientProvider` → Stack.
- **Styling:**
  - `src/global.css` contains `@import 'tailwindcss'; @import 'uniwind'; @import
    'heroui-native/styles';` and is imported by the root layout.
  - `metro.config.js` wraps the Expo config with `withUniwindConfig` as the outermost wrapper:
    `{ cssEntryFile: './src/global.css', dtsFile: './src/uniwind-types.d.ts' }`. The generated
    d.ts is committed, so a fresh clone type-checks.
- **`app.json`:** name "Forge", scheme `forge`, `userInterfaceStyle: 'automatic'`, portrait.
  `expo-status-bar` style `auto`; `expo-system-ui` keeps the Android root background theme-aware
  (D21).
- **`tsconfig`** extends `expo/tsconfig.base` and defines the path alias `@/*` → `src/*` (no
  `baseUrl`).

### 7.3 State

| State | Where | Persisted |
|---|---|---|
| JWT | Zustand `useSession` + `persist` over a SecureStore `StateStorage` adapter (key `forge.session`, `partialize` → token) | SecureStore |
| `['me']`, `['plan']` | TanStack Query | AsyncStorage persister: `shouldDehydrateQuery` = first key segment ∈ {me, plan} and status success; `buster` = app version; `maxAge` 7 days (`gcTime` 7 days) — decision B |
| `['entitlement']`, `['coach','messages']` | TanStack Query | no |
| Checklist ticks per session | Zustand `useChecklist`, in memory (D23) | no |
| Pending celebration: `{ kind: 'unlock', sessionId } \| { kind: 'planComplete' } \| null` | Zustand `usePlanCelebration`, in memory | no |

- `focusManager` is wired to `AppState`, so queries refetch on foreground. Default `staleTime`
  is 0: a cold launch paints from cache, then re-syncs.
- Mutations write the server's response into the cache (`setQueryData`); there is no
  refetch-after-mutate.
- **`signOut()`** (`src/lib/session.ts`) clears the token, runs `queryClient.clear()` and
  `persister.removeClient()`, and resets the in-memory stores (D28). It runs:
  - on Log out;
  - after account deletion;
  - before seeding a new sign-in;
  - when the API client receives a 401 for a request that carried a token (toast "Your session
    ended. Please sign in again.").

### 7.4 API client (`src/lib/api.ts`)

`request(method, path, { body?, schema? })`:

- Base URL is `EXPO_PUBLIC_API_URL`, falling back to `http://localhost:3000`;
  `apps/mobile/.env.example` documents it.
- Sends JSON with the bearer token from the session store; 15 s timeout.
- **2xx:** `schema.parse(json)` with the contracts response schema (D27); 204 → void.
- **Non-2xx:** the body is parsed with `apiErrorSchema` and thrown as
  `ApiError { status, code, message }`.
- **Network failure or timeout:** thrown as `ApiError { code: 'NETWORK' }`, a client-only code.

Query and mutation hooks live per feature in `src/features/<feature>/api.ts`.

### 7.5 Forms

- react-hook-form + `zodResolver(<contracts schema>)`.
- Inline `FieldError` under each field; a form-level `Alert` for server errors that belong to no
  field.
- The submit button shows a loading state.
- Layout uses `KeyboardAwareScrollView`, return-key focus chaining, and correct
  `autoComplete` / `textContentType` values.

### 7.6 Motion and haptics

Uses reanimated and expo-haptics. With `useReducedMotion()`, scale and translate are skipped;
colour changes and haptics stay.

| Moment | Motion | Haptic |
|---|---|---|
| Tick a block | check glyph scales in | selection |
| Last block ticked | "Complete session" enables with a one-off scale pulse | — |
| Session completed | navigate back | notification success |
| Plan regains focus after a completion or restart | newly open card: scale 0.96 → 1 spring, border animates to accent, the connector segment above it fills — once (decision D) | impact medium |
| Last session completed | "Plan complete" card slides/fades in on return | notification success |
| Chat bubble appears | FadeInDown | — |
| Coach is typing | three-dot loop | — |
| Paywall product selected | selection ring | selection |
| Purchase or restore succeeds | — | notification success |
| Mutation error toast | — | notification error |

The Plan screen consumes `usePlanCelebration` whenever it is focused — on return from session
detail, or immediately when Restart sets it while the screen is already showing — so the
animation runs where the user can see it, exactly once.

### 7.7 UI rules (Plan B review checklist)

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

Shared components: `ScreenState` (icon, title, body, optional action), skeleton layouts, and a
toast helper over HeroUI Toast.

## 8. Screens

Each screen lists its **primary** action, composition, states and copy. HeroUI components:
Button, LinkButton, CloseButton, TextField, Input, InputGroup, Label, Description, FieldError,
Checkbox, RadioGroup, Card, Surface, Separator, ListGroup, Chip, Avatar, Alert, Dialog, Toast,
Skeleton, SkeletonGroup, Spinner, PressableFeedback.

**Sign in** — primary "Sign in"
- Header: "Forge" wordmark and "Three sessions. Unlocked in order."
- Fields: Email; Password in an InputGroup with a show/hide toggle.
- A form Alert covers INVALID_CREDENTIALS ("Email or password is incorrect.") and NETWORK
  ("Can't reach Forge. Check your connection and try again.").
- Footer LinkButton: "New here? Create an account".

**Sign up** — primary "Create account"
- "Create your account" / "Your plan and progress stay private to you."
- Fields: Email; Password with Description "At least 8 characters."
- EMAIL_TAKEN shows as the email FieldError.
- Footer: "Already have an account? Sign in".

**Onboarding** — primary "Start training"
- "Make it yours" / "Three quick things before your first session."
- Name TextField: label "What should we call you?", placeholder "Your first name".
- Goal: RadioGroup of three card-style options, each with a label and a one-liner (§9.1).
- Consent: Checkbox with "I agree that Forge stores my profile, progress and coach messages to
  personalise my training. I can delete all of it in Settings."
- On success, `['me']` is replaced and the guard moves to the tabs.

**Plan** (decision D) — primary: the sticky "Next session" bar
- **Header:** time-of-day greeting "Good morning, {name}", a goal Chip, "{n} of 3 complete",
  and a three-segment progress bar (completed segments in accent).
- **Timeline:** three cards joined by a vertical connector on a left rail of status nodes. Each
  card shows the overline "Session {number} · {min} min", title, subtitle and a status line:

  | Status | Treatment |
  |---|---|
  | completed | check-glyph node; card and text muted; "Completed" |
  | open | accent border; elevated; "Up next" Chip |
  | locked | lock glyph inline with "Unlocks after Session {number−1}"; muted title; full opacity; lowest elevation |

  Every card opens the session detail (a locked card opens a read-only preview, D24).
- **Sticky bar** (safe-area aware, above the tab bar): overline "Next session", then
  "{title} · {min} min", and a primary Button "Start".
- **Plan complete:** a header card reads "Plan complete" / "All three sessions done. Run it
  back to lock in the habit." The bar's button becomes "Restart plan", which resets with no
  dialog (D25), toasts "Plan restarted" and replays the unlock motion on Foundation.
- **States:**
  - First load with no cache: skeleton timeline.
  - Error with no cache: ScreenState "Can't load your plan" + "Try again".
  - When a cache exists, background errors stay silent.
  - Pull-to-refresh.

**Session detail** `/session/[id]` — primary "Complete session" (open sessions only)
- **Header:** back; overline "Session {number} · {min} min"; title; subtitle; status Chip.
- **Open:**
  - Checklist rows, each with a Checkbox, the kind label (e.g. "Warm-up"), a title and a
    detail line.
  - The button stays disabled until every block is ticked. The caption reads "Tick each block
    as you finish it.", then "Finishing unlocks {next title}." once all are ticked (last
    session: "Finishing completes your plan.").
  - On success: success haptic, clear the ticks, set the celebration, `router.back()`.
  - 409 → toast "This session is still locked." and refetch the plan.
  - NETWORK → toast "Couldn't save. Check your connection and try again."
- **Completed:** every row ticked and muted; no CTA; note "Completed. Restart the plan from the
  Plan tab to go again."
- **Locked:** rows shown without checkboxes as a preview; notice "Unlocks after Session
  {number−1} · {previous title}"; no CTA.
- An id missing from the cached plan → ScreenState "Session not found" + "Back to plan".

**Coach** — entitlement loading → skeleton; error → ScreenState + "Try again"
- **Free (teaser)** — primary "Unlock Coach", which opens `/paywall`.
  - "Meet your coach" / "Ask about your next session, warm-ups or fitting training into a busy
    day. Your coach knows your goal and your progress."
  - Three benefit lines.
- **Plus (chat)** — primary: send.
  - **Empty:** coach Avatar, "Hi {name}, I'm your Forge coach." / "Ask me anything about your
    plan.", and four suggested-prompt chips (§9.2); tapping a chip sends it.
  - **List:** inverted FlatList; user bubbles on the right (accent), coach bubbles on the left
    (surface); a typing bubble while a request is in flight.
  - **Composer:** multiline Input and a send button that is disabled when empty or sending; it
    sticks to the keyboard (keyboard-controller).
  - **Send:** an optimistic user bubble; on success, swap in the server message and append the
    reply. On failure, remove the bubble, restore the draft, and show an inline Alert "Message
    not sent. Check your connection and try again."
  - History error → ScreenState + "Try again".

**Paywall** (modal) — primary "Start 7-day trial"
- Layout: CloseButton; "Forge Plus" / "Your coach, on call for every session."; three benefit
  lines with check glyphs; two selectable product cards in a RadioGroup (§9.3, Yearly selected
  by default, with a "Best value" Chip).
- Caption "7 days free, then {price}. Cancel anytime."; LinkButton "Restore purchases"; footer
  Chip "Sandbox · no real charge".
- **Purchase succeeds:** success haptic, toast "Welcome to Forge Plus", dismiss.
- **Restore:** if Plus → toast "Purchases restored", dismiss; if still free → toast "No
  purchases to restore on this account."
- **Errors:** inline Alert.

**Settings** — no primary action (a list plus one destructive action)
- Header: Avatar (initials), name, email.
- ListGroup rows:

  | Section | Row | Behaviour |
  |---|---|---|
  | Profile | Name, Goal | open `/profile` |
  | Privacy | "Data consent — Accepted {d MMM yyyy}" | read-only; `Intl.DateTimeFormat` |
  | Membership | "Forge Plus · Trial ends {d MMM}" or "Free — See Forge Plus" | free opens `/paywall` (D26) |
  | Account | "Log out" | runs `signOut()` |
  | Account | "Delete account & data" (danger) | opens the Dialog below |

- **Delete Dialog:** "Delete your account?" / "This permanently deletes your profile, plan
  progress, coach history and membership. This can't be undone." with [Cancel] and [Delete
  everything]. Confirming calls `DELETE /me`, then `signOut()`, then toasts "Your account and
  data were deleted."
- Footer: "Forge {version}".

**Edit profile** `/profile` — primary "Save changes" (enabled once dirty)
- Name and goal fields, shared with onboarding.
- On success: toast "Profile updated" and go back.

**Root ErrorBoundary:** ScreenState "Something went wrong" + "Try again".

## 9. Content

### 9.1 Plan template (API) and labels (mobile)

| # | Id | Title | Subtitle | Min | Blocks (kind · title — detail) |
|---|---|---|---|---|---|
| 1 | foundation | Foundation | Learn the moves, find your pace | 25 | warm_up · Mobility flow — 5 min · hips, shoulders and ankles<br>main_set · Bodyweight basics — 3 rounds · squat, push-up, row × 10<br>cool_down · Breathe it out — 5 min · easy stretch, long exhales |
| 2 | build | Build | Add volume, keep control | 35 | warm_up · Dynamic prep — 6 min · lunges, arm circles, skips<br>main_set · Tempo strength — 4 rounds · 3-second lowers on every rep<br>finisher · Hold strong — 3 × 40 s · plank or wall sit<br>cool_down · Downshift — 5 min · walk and stretch |
| 3 | forge | Forge | Put it all together | 40 | warm_up · Ramp up — 8 min · build to working pace<br>main_set · Strength complex — 5 rounds · squat, push, hinge, pull<br>finisher · Intervals — 6 × 20 s hard, 40 s easy<br>cool_down · Reset — 6 min · mobility and slow breathing |

- **Block labels:** warm_up "Warm-up", main_set "Main set", finisher "Finisher", cool_down
  "Cool-down".
- **Goal labels:**
  - get_stronger "Get stronger" — "Build strength you can feel week to week."
  - move_daily "Move daily" — "Keep your body moving, even on busy days."
  - build_habit "Build a habit" — "Show up consistently until it sticks."

### 9.2 Coach replies — `composeCoachReply` (pure, deterministic)

- **Name:** `displayName`, or "there" (defensive only: the app reaches Coach after onboarding).
- **Goal phrase:** get_stronger "getting stronger", move_daily "moving every day", build_habit
  "building a habit that sticks", null "training".
- **Progress line:**
  - 0 done: "You haven't started yet — Foundation is open."
  - 1–2 done: "You've completed {n} of 3 sessions; {next} is up next."
  - 3 done: "You've completed all 3 sessions."

Reply = `{body} {progress line}`. Every reply contains the name, the goal phrase and the progress
line. The intent is the first match (substring, lowercased message) in this order:

| Intent | Matches | Body |
|---|---|---|
| recovery | sore, pain, hurt, rest, recover | "{name}, some soreness after a new session is normal; sharp pain isn't — stop and get it checked. Easy walking helps you recover and keep {goal}." |
| warm-up | warm, mobility, stretch | "Start easy, {name}: five minutes of mobility for hips, shoulders and ankles, then a few slow reps of your first exercise. It's the cheapest win for {goal}." |
| short on time | time, busy, quick, short, minutes | "Short on time, {name}? Do the warm-up and main set of {next, or Foundation when complete} and skip the rest. Consistency beats length when you're {goal}." |
| consistency | consisten, habit, motivat, skip, tired | "{name}, tie training to something you already do every day and keep the bar low — one session this week is a real win for {goal}." |
| next | next, today, session, plan | open: "{name}, your next session is {next}: {min} minutes across {k} blocks, built for {goal}. Keep the main set steady and finish every block." · complete: "{name}, the plan is done. Restart it from the Plan tab and aim for smoother reps on the second pass — that's how {goal} compounds." |
| fallback | — | "Good question, {name}. I can help with your next session, warming up, short workouts or staying consistent while you're {goal}." |

Suggested prompts (mobile, empty state), each mapping to one intent: "What's my next session?",
"How should I warm up?", "I only have 15 minutes", "How do I stay consistent?".

### 9.3 Paywall products (mobile display; ids from contracts)

| Id | Label | Price | Extra |
|---|---|---|---|
| forge_plus_yearly (default) | Yearly | $59.99 / year | "Best value" Chip · "$5.00 / month, billed yearly" |
| forge_plus_monthly | Monthly | $9.99 / month | — |

Benefit lines (teaser and paywall): "Answers that know your goal and progress" · "Help on
warm-ups, short workouts and recovery" · "Your conversation history, private to you".

## 10. Testing

**API unit tests** (Jest, TDD red → green → refactor, in-memory adapters, no DB):

- **auth.service:** signup stores a hash (not the password) and a lowercased email; a duplicate
  → EMAIL_TAKEN; login returns a token whose `sub` verifies; a wrong password and an unknown
  email both → INVALID_CREDENTIALS.
- **users.service:** `onboarded` mapping; partial updates; `acceptConsent` sets the timestamp
  once (a second call keeps the first date); `onboarded` is true only with all three fields;
  `deleteMe` removes the user.
- **plan.service:**
  - A fresh user gets [open, locked, locked] and `nextSessionId` foundation.
  - Completing the open session advances; completing a completed one returns the unchanged view;
    completing a locked one → SESSION_LOCKED; an unknown id → SESSION_NOT_FOUND.
  - After all three, `nextSessionId` is null; reset returns to 0.
  - Two users progress independently.
- **coach-reply:** every intent, including its precedence; every reply contains the name, goal
  phrase and progress line; same input → same output; null name and goal fallbacks.
- **coach.service:**
  - A free user → PLUS_REQUIRED on both history and send.
  - `send` appends the user message, awaits the delay, then appends the coach message.
  - History is per user, ordered, and capped at 100.
- **billing.service:** default free; purchase → Plus with `trialEndsAt` = now + 7 days (fake
  timers); a second purchase switches product and keeps the trial end; restore returns free or
  Plus as appropriate; users are isolated.

**API e2e** (supertest, docker-compose Postgres `forge_test`):

Setup: the Jest `globalSetup` runs `drizzle-kit push --force` against `TEST_DATABASE_URL`; each
test uses unique emails; coach latency is 0 (D18).

1. **Auth:** signup → login → `GET /me`; duplicate → 409; wrong password → 401; missing or
   garbage token → 401; every error body has the `{code, message}` shape.
2. **Plan order:**
   1. Fresh plan.
   2. Complete forge → 409 SESSION_LOCKED.
   3. Complete foundation → 200, then again → 200 no-op.
   4. Complete build → reset → the plan is fresh again.
   5. Unknown id → 404.
3. **Isolation and gate:**
   - User A onboards (`PATCH /me`), purchases, then chats; the reply names A and the history
     holds 2 messages.
   - User B is free → 403 on both coach endpoints.
   - B's plan is untouched by A's progress.
4. **Deletion:** `DELETE /me` → 204; the same token → 401; login → 401; no rows remain for that
   id in any table.

**Contracts:** the `node:test` smoke test (§4.4).

**Mobile:**
- No automated tests (TDD exemption). After each screen task, run the `mobile-self-check`
  skill: screenshots go to `docs/screenshots/<screen>[-<state>].png`.
- The final walkthrough also captures dark mode for Plan and Coach and a cold relaunch (kill
  Expo Go → the plan paints from cache → re-syncs).

**Gate before every commit:** `pnpm typecheck && pnpm lint && pnpm test`, plus
`pnpm test:e2e` for API tasks that touch HTTP or the DB.

## 11. Scaffolding and plan split

### Plan 0 — Foundation (ends with contracts frozen)

1. Root workspace: files from §3, pnpm pin, turbo, prettier, `.gitignore` (list from
   `.claude/rules/git.md`), `docker-compose.yml` + `docker/postgres/init.sql`.
2. `@forge/contracts`, complete per §4, with the smoke test.
3. `apps/api`:
   - Scaffold with `@nestjs/cli@11 new` (non-interactive: pnpm, skip git, skip install, strict;
     confirm the flags with `--help`) and delete the sample controller and service.
   - TS 6 tsconfig without the deprecated `baseUrl`.
   - `config.ts`, `DbModule`, the Drizzle schema (§5) with `db:push`, `AppError` + filter +
     `ZodValidationPipe`.
   - Jest unit and e2e configs, plus one e2e smoke: an unknown route → 404
     `{ code: 'NOT_FOUND' }`.
4. `apps/mobile`:
   - Scaffold with `create-expo-app`, blank TypeScript template at the SDK 57 tag, no install
     (confirm the flags with `--help`).
   - Add Expo Router by hand: `main: expo-router/entry`, the plugin, the scheme.
   - Install native deps with `npx expo install`.
   - Uniwind metro config and `global.css`; the provider stack.
   - One placeholder route that renders a HeroUI Card and Button. Verify it in Expo Go on an
     iPhone 16 simulator in light and dark, and take a screenshot.
5. heroui-native skill, project-scoped:
   `curl -fsSL https://heroui.com/install | HEROUI_SKILL_SCOPE=project bash -s heroui-native`
   (installs into `.claude/skills/`; committed, D31).
6. README skeleton with the §12 headings.

**Gate:** `pnpm i && pnpm build && pnpm typecheck && pnpm lint && pnpm test` all green, and
`docker compose up -d && pnpm db:push && pnpm test:e2e` green.

### Plan A — API

Order: users + auth + guard → plan → billing → coach (coach depends on the other three). Each
module goes service TDD with in-memory adapters → Drizzle adapter → controller. Then the four
e2e flows, then the README's API section.

### Plan B — Mobile

1. App shell: API client, session store, query persistence, `signOut`, boot/splash gate,
   guards, tabs, `ScreenState` and skeleton primitives.
2. Sign in and sign up.
3. Onboarding.
4. Plan.
5. Session detail, with the completion and unlock motion.
6. Coach (teaser and chat).
7. Paywall.
8. Settings, edit profile and delete account.
9. Final walkthrough — cold relaunch, dark mode, Android only if `emulator -list-avds` shows
   one (otherwise say so in `apps/mobile/README.md`) — then complete the README.

Every task that ships a screen ends with `mobile-self-check`.

## 12. README (root)

In this order:

1. Loom link placeholder.
2. What Forge is, in one paragraph.
3. Prerequisites: Node 24 via nvm, pnpm 10 via corepack, Docker, and Xcode Simulator or an
   Android emulator with Expo Go.
4. Quick start:
   1. `pnpm i`
   2. `docker compose up -d`
   3. `cp apps/api/.env.example apps/api/.env`
   4. `pnpm db:push` — explain push vs migrations
   5. `pnpm dev:api`
   6. `pnpm dev:mobile`, then press `i`
5. Running on a device: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000`; the Android emulator uses
   `http://10.0.2.2:3000`.
6. Tests: `pnpm test` and `pnpm test:e2e`.
7. Screenshots grid.
8. Architecture in about ten lines, with links to this spec and `docs/decisions/`.
9. "What I'd change with one more hour": three concrete UI items, written after the final
   walkthrough.
10. Optional Supabase note (`prepare: false` on the transaction pooler).

## 13. Decision log (what · why · cost if wrong)

| # | What | Why | Cost if wrong |
|---|---|---|---|
| D1 | Expo SDK 57 | rules say "latest stable"; Expo CLI installs the SDK 57 Expo Go on simulators | if the App Store Expo Go lags, physical iPhones need `eas go` (README notes it) |
| D2 | NestJS 11.2.x, not 12 | rules pin 11; npm `latest` is 12 | none now; upgrading later is a routine bump |
| D3 | pnpm 10.34.5 via `packageManager` | unpinned corepack resolves pnpm 12 on this machine | none |
| D4 | TypeScript ~6.0.3 monorepo-wide | Expo 57 template pin; ts-jest supports < 7 and typescript-eslint < 6.1 | if Nest CLI 11 misbehaves on 6.0, fall back to 5.9.3 everywhere and log it |
| D5 | Session ids are slugs (`foundation`, `build`, `forge`) | readable routes, logs and tests | renaming a session changes the contract |
| D6 | Plan content lives in the API template and ships in `GET /plan` | the server is the single source of truth for content and status; the client only renders | copy changes need an API restart |
| D7 | `complete()` is a compare-and-set UPDATE | double taps and races can't double-advance | none |
| D8 | Unknown session id → 404 SESSION_NOT_FOUND; the path param isn't zod-validated | a missing resource, not a malformed request | none |
| D9 | Entitlement in its own table; row ⇔ Plus; one trial per account | billing owns its data, like a store-webhook target in production | one extra table |
| D10 | `mock-restore` re-reads the server record | mirrors the real client flow without StoreKit | none; documented as a mock |
| D11 | Both coach endpoints require Plus, enforced in `CoachService` | the server enforces gates, like plan order | none |
| D12 | Coach message ids are bigint identity; history = last 100, oldest first | deterministic order even when timestamps tie; bounded payload | no pagination past 100 |
| D13 | Coach latency injected via `COACH_DELAY`, configurable by env, 0 in e2e | fast, deterministic tests | none |
| D14 | JWT HS256 with 30-day expiry, no refresh, client-side logout; the guard rejects tokens of deleted users | scope | a leaked token stays valid ≤ 30 days; one PK lookup per request |
| D15 | Unknown-email login still runs bcrypt against a dummy hash | no user enumeration through timing | ~70 ms per failed login |
| D16 | Env via `process.loadEnvFile()` + zod-parsed config; no dotenv or @nestjs/config | built into Node 24, no dependency | none |
| D17 | `drizzle-kit push` for dev and e2e; no migration files | rules allow it; a single schema version | production would switch to generate + migrate |
| D18 | e2e uses a separate `forge_test` database with unique emails and no truncation | isolation without cleanup code | the test DB grows until the docker volume is reset |
| D19 | No API Dockerfile; docker-compose runs Postgres only | reviewers need Node for Expo anyway | none |
| D20 | Add `react-native-keyboard-controller` (ships in Expo Go) | reliable keyboard-aware forms and chat composer; RN's `KeyboardAvoidingView` is inconsistent across platforms | one new dependency — approved with this spec |
| D21 | `@expo/vector-icons` (Ionicons) for glyphs; `expo-system-ui` for the theme-aware Android root | both ship in Expo Go and are Expo defaults | none |
| D22 | Expo Router JS `Tabs`, not NativeTabs | stable API; identical on iOS 18 simulators and Android | a less native feel than the iOS 26 tab bar |
| D23 | Checklist ticks are client-only (in memory) and gate "Complete session" | decision A forbids per-session rows; gating gives the checklist a purpose | ticks reset when the app is killed |
| D24 | Locked sessions open a read-only preview | full-opacity locked cards (decision D) invite a tap | none |
| D25 | Restart has no confirmation; Foundation replays the unlock motion | low stakes; redoing the sessions reverses it | an accidental restart loses the 3/3 state |
| D26 | Settings adds a Membership row and an Edit profile screen (`PATCH /me`) | entitlement is visible and name/goal are editable, for about one screen of work | small scope growth; the first thing cut inside Settings |
| D27 | Mobile parses every response with its contracts schema | drift surfaces as a clear error, not a silent `undefined` | negligible CPU |
| D28 | `signOut()` clears the token, both caches and the in-memory stores; any authenticated 401 signs out | "their data only" on a shared device | none |
| D29 | `dev:api` and `dev:mobile` use `pnpm --filter`, not turbo | keeps Expo's interactive CLI usable | none |
| D30 | Contracts smoke test uses `node:test` | no test-framework dependency | none |
| D31 | heroui-native skill installed project-scoped and committed | implementers and reviewers see the same guidance | vendor files in `.claude/skills/` |
| D32 | `User.onboarded` is computed by the API | the client renders, it doesn't derive rules | none |
| D33 | Consent is a timestamp set once, with no withdrawal | deleting the account is the revocation path | a "withdraw consent" feature would need a new endpoint |

## 14. Risks

- **Expo Go on a physical iPhone:** at SDK 57 launch, the App Store Expo Go lagged behind the
  SDK. Simulators and Android are unaffected; the README points at `eas go`.
- **TS 6.0 with Nest CLI 11:** if build or watch misbehaves, use D4's fallback.
- **No Android emulator on this machine:** Android is checked only if an AVD appears, and the
  README says so.
- **Uniwind class scanning in a hoisted monorepo:** if HeroUI classes go missing, add
  `@source` pointing at the hoisted `node_modules/heroui-native/lib`.
