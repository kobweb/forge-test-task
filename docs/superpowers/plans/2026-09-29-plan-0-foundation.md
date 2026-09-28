# Plan 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working monorepo with:
- a pinned toolchain;
- the complete `@forge/contracts`, frozen from here on;
- a NestJS API skeleton that boots against the docker-compose Postgres with the schema, error
  envelope and validation pipe in place;
- an Expo SDK 57 app that renders HeroUI Native + Uniwind in Expo Go.

**Architecture:** Turborepo + pnpm workspaces (hoisted).
- `packages/contracts` is the only shared code (types, zod schemas, route constants), built to
  CommonJS.
- `apps/api` is scaffolded with `nest new`, then cut down to config, database, error envelope
  and validation pipe.
- `apps/mobile` is scaffolded with `create-expo-app`, then wired for Expo Router, Uniwind and
  HeroUI Native.
- Plan A (API) and Plan B (mobile) build on top without changing the contracts.

**Tech Stack:** Node 24, pnpm 10.34.5, Turborepo 2, TypeScript ~6.0.3, zod 4, NestJS 11,
Drizzle 0.45 + postgres.js, Jest 30 + ts-jest, Postgres 16 (docker compose), Expo SDK 57, Expo
Router 57, HeroUI Native 1.0, Uniwind 1.12, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-09-28-forge-design.md` (read it first; this plan
implements §2–§5, the §6.8/§7.2 scaffolding and §11 "Plan 0").

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

Failure modes the spec implies but no spec-listed test covers, most likely first. Each line
names the task that pins it with a test or check.

1. **Email typed with capitals or spaces.** `  Alex@Example.COM ` must become
   `alex@example.com`, or the same person could register twice and fail to log in. *Task 2:
   smoke-test assertion.*
2. **Goals picked out of order or twice.** The set must come back deduplicated in `GOALS`
   order, and an empty set must fail with "Pick at least one goal.". *Task 2: smoke-test
   assertions.*
3. **A non-Latin password over 72 bytes.** 37 × `é` is 74 bytes, and bcrypt would silently
   truncate it, so it must be rejected. *Task 2: smoke-test assertion.*
4. **An unknown route or malformed request.** The answer must be the `{ code, message }` JSON
   envelope, never HTML or a stack trace. *Task 3: filter unit test + e2e smoke.*
5. **A second build after an edit.** It must still emit `dist/main.js`: Nest's `deleteOutDir`
   plus an incremental `tsbuildinfo` outside `dist` silently skipped emitting. *Task 3: build,
   touch, build again.*

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
package.json · pnpm-workspace.yaml · turbo.json · .prettierrc · .gitignore
docker-compose.yml · docker/postgres/init.sql · README.md
docs/decisions/plan-0.md
.claude/skills/heroui-native/            (installed by Task 5)
packages/contracts/
  package.json · tsconfig.json
  src/domain.ts · src/routes.ts · src/index.ts
  src/schemas/{auth,me,plan,coach,billing,error}.ts
  test/smoke.test.cjs
apps/api/                                (from `nest new`, then reshaped)
  package.json · tsconfig.json · tsconfig.build.json · nest-cli.json · eslint.config.mjs
  drizzle.config.ts · .env.example
  src/main.ts · src/app.module.ts · src/config.ts · src/config.module.ts
  src/db/schema.ts · src/db/db.module.ts
  src/common/app-error.ts · http-error.filter.ts (+ .spec.ts) · zod-validation.pipe.ts (+ .spec.ts)
  test/jest-e2e.json · test/test-env.ts · test/global-setup.ts · test/setup-env.ts · test/app.e2e-spec.ts
apps/mobile/                             (from `create-expo-app`, then reshaped)
  package.json · app.json · tsconfig.json · metro.config.js · eslint.config.js · .env.example
  src/global.css · src/env.d.ts · src/uniwind-types.d.ts (generated, committed)
  src/app/_layout.tsx · src/app/index.tsx (placeholder, replaced in Plan B)
```

---

### Task 1: Workspace root, pinned toolchain, local Postgres

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.prettierrc`, `.gitignore`,
  `docker-compose.yml`, `docker/postgres/init.sql`, `docs/decisions/plan-0.md`

**Interfaces:**
- Consumes: nothing (the repo holds only `CLAUDE.md`, `.nvmrc`, `.claude/`, `docs/`,
  `bootstrap-forge.sh`).
- Produces:
  - Root scripts `dev:api`, `dev:mobile`, `build`, `test`, `test:e2e`, `typecheck`, `lint`,
    `db:push`.
  - Postgres at `postgres://forge:forge@localhost:5432/forge`, plus the database `forge_test`.

- [ ] **Step 1: Write the root `package.json`**

```json
{
  "name": "forge",
  "private": true,
  "packageManager": "pnpm@10.34.5",
  "engines": {
    "node": ">=24 <25"
  },
  "scripts": {
    "dev:api": "pnpm --filter @forge/contracts build && pnpm --filter @forge/api dev",
    "dev:mobile": "pnpm --filter @forge/contracts build && pnpm --filter @forge/mobile dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "db:push": "pnpm --filter @forge/contracts build && pnpm --filter @forge/api db:push"
  },
  "devDependencies": {
    "prettier": "^3.6.2",
    "turbo": "^2.11.5"
  }
}
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*

nodeLinker: hoisted

# pnpm 10 skips dependency build scripts unless they are listed here.
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
  - unrs-resolver
```

(The three `onlyBuiltDependencies` entries are what pnpm 10 reported as "Ignored build scripts"
once the full dependency set was installed; listing them now avoids the interactive
`pnpm approve-builds`.)

- [ ] **Step 3: Write `turbo.json`, `.prettierrc` and `.gitignore`**

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:e2e": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

```gitignore
node_modules
dist
.turbo
.expo
.env
.superpowers
.worktrees
.heroui-docs
coverage
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 4: Write `docker-compose.yml` and `docker/postgres/init.sql`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: forge
      POSTGRES_PASSWORD: forge
      POSTGRES_DB: forge
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U forge -d forge']
      interval: 2s
      timeout: 3s
      retries: 20

volumes:
  pgdata:
```

```sql
-- Runs once, on the first start of an empty volume: a separate database for e2e tests.
CREATE DATABASE forge_test;
```

- [ ] **Step 5: Install and verify the toolchain**

Run: `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm -v && pnpm install && pnpm exec turbo --version`
Expected: `10.34.5`, then a successful install that writes `pnpm-lock.yaml`, then a
`2.x` version.

- [ ] **Step 6: Start Postgres and verify both databases**

Run: `docker compose up -d --wait && docker compose exec -T db psql -U forge -d forge -tAc "select datname from pg_database where datname in ('forge','forge_test') order by 1"`
Expected: `forge` and `forge_test`, one per line.

- [ ] **Step 7: Record decisions**

Create `docs/decisions/plan-0.md`:

```markdown
# Plan 0 — decisions (what · why · cost if wrong)

- pnpm pinned with `packageManager: pnpm@10.34.5` · corepack otherwise resolves pnpm 12 on this machine · none
- `onlyBuiltDependencies`: @parcel/watcher, esbuild, unrs-resolver · pnpm 10 skips build scripts and `approve-builds` is interactive · a newly added native-binary package may need to be added here
- turbo `lint` depends on `^build` (the spec's §3 lists lint without it) · type-aware ESLint in the API needs the contracts' `.d.ts` · slightly slower cold lint
```

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .prettierrc .gitignore docker-compose.yml docker/postgres/init.sql docs/decisions/plan-0.md
git commit -m "chore: monorepo root, pinned toolchain and local postgres"
```

---

### Task 2: `@forge/contracts` (complete, then frozen)

**Files:**
- Create: `packages/contracts/package.json`, `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/domain.ts`, `src/routes.ts`, `src/index.ts`
- Create: `packages/contracts/src/schemas/auth.ts`, `me.ts`, `plan.ts`, `coach.ts`,
  `billing.ts`, `error.ts`
- Test: `packages/contracts/test/smoke.test.cjs`

**Interfaces:**
- Consumes: nothing.
- Produces: the whole public surface of `@forge/contracts`. Plans A and B reference these exact
  names; nothing else may be added after Plan 0.
  - **Const tuples:** `GOALS`, `SESSION_IDS`, `SESSION_STATUSES`, `BLOCK_KINDS`,
    `ENTITLEMENT_TIERS`, `PRODUCT_IDS`, `COACH_ROLES`, `ERROR_CODES`.
  - **Union types:** `Goal`, `SessionId`, `SessionStatus`, `BlockKind`, `EntitlementTier`,
    `ProductId`, `CoachRole`, `ErrorCode`.
  - **Domain interfaces:**
    - `User { id; email; displayName: string | null; goals: Goal[]; consentAcceptedAt: string | null; onboarded: boolean }`
    - `SessionBlock { kind; title; detail }`
    - `PlanSession { id: SessionId; number; title; subtitle; durationMinutes; blocks: SessionBlock[]; status: SessionStatus }`
    - `PlanView { sessions: PlanSession[]; completedCount; totalCount; nextSessionId: SessionId | null }`
    - `CoachMessage { id: string; role: CoachRole; text; createdAt: string }`
    - `Entitlement { tier: EntitlementTier; productId: ProductId | null; trialEndsAt: string | null }`
    - `ApiError { code: ErrorCode; message }`
  - **Route constants:** `routes.auth.signup`, `routes.auth.login`, `routes.me`,
    `routes.plan.get`, `routes.plan.complete(id: string)`, `routes.plan.reset`,
    `routes.coach.messages`, `routes.billing.entitlement`, `routes.billing.mockPurchase`,
    `routes.billing.mockRestore`.
  - **Auth schemas:** `emailSchema`, `newPasswordSchema`, `signupBodySchema` → `SignupBody`,
    `loginBodySchema` → `LoginBody`, `authResponseSchema` → `AuthResponse`.
  - **Profile schemas:** `displayNameSchema`, `goalSchema`, `goalsSchema` (dedupes and sorts in
    `GOALS` order), `userSchema`, `updateMeBodySchema` → `UpdateMeBody`,
    `onboardingBodySchema` → `OnboardingBody`.
    - `onboardingBodySchema.acceptConsent`: input `boolean`, output `true`.
  - **Plan schemas:** `sessionIdSchema`, `sessionBlockSchema`, `planSessionSchema`,
    `planViewSchema`.
  - **Coach schemas:** `coachMessageSchema`, `sendCoachMessageBodySchema` →
    `SendCoachMessageBody`, `coachHistoryResponseSchema` → `CoachHistoryResponse`,
    `sendCoachMessageResponseSchema` → `SendCoachMessageResponse`.
  - **Billing and error schemas:** `productIdSchema`, `entitlementSchema`,
    `mockPurchaseBodySchema` → `MockPurchaseBody`, `apiErrorSchema`.

- [ ] **Step 1: Write the package manifest and tsconfig**

```json
{
  "name": "@forge/contracts",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch --preserveWatchOutput",
    "typecheck": "tsc --noEmit",
    "test": "tsc && node --test test/smoke.test.cjs"
  },
  "dependencies": {
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "typescript": "~6.0.3"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": []
  },
  "include": ["src"]
}
```

Run: `pnpm install`
Expected: the workspace now has 1 project besides the root; `zod` and `typescript` are hoisted
to the root `node_modules`.

- [ ] **Step 2: Write the failing smoke test**

```js
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
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @forge/contracts test`
Expected: FAIL. `tsc` reports that no inputs were found in `src` (the package has no source
yet).

- [ ] **Step 4: Write the domain types**

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
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'INVALID_CREDENTIALS',
  'PLUS_REQUIRED',
  'NOT_FOUND',
  'SESSION_NOT_FOUND',
  'EMAIL_TAKEN',
  'SESSION_LOCKED',
  'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// Timestamps cross the wire as ISO 8601 strings.
export interface User {
  id: string; // uuid; JWT `sub`
  email: string; // lowercased
  displayName: string | null;
  goals: Goal[]; // a set in GOALS order; [] until onboarding
  consentAcceptedAt: string | null;
  onboarded: boolean; // name, >= 1 goal and consent all set; computed by the API
}

export interface SessionBlock {
  kind: BlockKind;
  title: string;
  detail: string;
}

export interface PlanSession {
  id: SessionId;
  number: number; // 1-based position in the plan
  title: string;
  subtitle: string;
  durationMinutes: number;
  blocks: SessionBlock[];
  status: SessionStatus;
}

export interface PlanView {
  sessions: PlanSession[]; // template order
  completedCount: number; // 0..totalCount
  totalCount: number;
  nextSessionId: SessionId | null; // the open session; null when the plan is complete
}

export interface CoachMessage {
  id: string;
  role: CoachRole;
  text: string;
  createdAt: string;
}

export interface Entitlement {
  tier: EntitlementTier;
  productId: ProductId | null; // null when free
  trialEndsAt: string | null; // null when free
}

export interface ApiError {
  code: ErrorCode;
  message: string;
}
```

- [ ] **Step 5: Write the schemas**

`src/schemas/me.ts` (the auth schemas import `userSchema` from it):

```ts
import { z } from 'zod';
import { GOALS, type Goal, type User } from '../domain';

export const displayNameSchema = z
  .string('Tell us what to call you.')
  .trim()
  .min(1, 'Tell us what to call you.')
  .max(40, 'Keep it under 40 characters.');

export const goalSchema = z.enum(GOALS);

const byGoalOrder = (a: Goal, b: Goal): number => GOALS.indexOf(a) - GOALS.indexOf(b);

// A set of goals: duplicates are dropped and the output is always in GOALS order.
export const goalsSchema = z
  .array(goalSchema, 'Pick at least one goal.')
  .min(1, 'Pick at least one goal.')
  .max(GOALS.length, 'Pick at most three goals.')
  .transform((goals) => [...new Set(goals)].sort(byGoalOrder));

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  goals: z.array(goalSchema),
  consentAcceptedAt: z.iso.datetime().nullable(),
  onboarded: z.boolean(),
}) satisfies z.ZodType<User>;

export const updateMeBodySchema = z
  .object({
    displayName: displayNameSchema.optional(),
    goals: goalsSchema.optional(),
    acceptConsent: z.literal(true).optional(),
  })
  .refine(
    (body) =>
      body.displayName !== undefined ||
      body.goals !== undefined ||
      body.acceptConsent !== undefined,
    'Nothing to update.',
  );
export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;

// The onboarding form: every field required. Its output is always a valid UpdateMeBody.
// acceptConsent takes a checkbox boolean as input and only lets `true` through.
export const onboardingBodySchema = z.object({
  displayName: displayNameSchema,
  goals: goalsSchema,
  acceptConsent: z
    .boolean('Please accept to continue.')
    .pipe(z.literal(true, 'Please accept to continue.')),
});
export type OnboardingBody = z.infer<typeof onboardingBodySchema>;
```

`src/schemas/auth.ts`:

```ts
import { z } from 'zod';
import { userSchema } from './me';

// bcrypt only looks at the first 72 bytes of a password.
const MAX_PASSWORD_BYTES = 72;

function utf8Length(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export const emailSchema = z
  .string('Enter a valid email address.')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254, 'Enter a valid email address.'));

export const newPasswordSchema = z
  .string('Use at least 8 characters.')
  .min(8, 'Use at least 8 characters.')
  .refine((value) => utf8Length(value) <= MAX_PASSWORD_BYTES, 'Use 72 characters or fewer.');

export const signupBodySchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});
export type SignupBody = z.infer<typeof signupBodySchema>;

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string('Enter your password.').min(1, 'Enter your password.'),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const authResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
```

`src/schemas/plan.ts`:

```ts
import { z } from 'zod';
import {
  BLOCK_KINDS,
  SESSION_IDS,
  SESSION_STATUSES,
  type PlanSession,
  type PlanView,
  type SessionBlock,
} from '../domain';

export const sessionIdSchema = z.enum(SESSION_IDS);

export const sessionBlockSchema = z.object({
  kind: z.enum(BLOCK_KINDS),
  title: z.string(),
  detail: z.string(),
}) satisfies z.ZodType<SessionBlock>;

export const planSessionSchema = z.object({
  id: sessionIdSchema,
  number: z.number().int().positive(),
  title: z.string(),
  subtitle: z.string(),
  durationMinutes: z.number().int().positive(),
  blocks: z.array(sessionBlockSchema),
  status: z.enum(SESSION_STATUSES),
}) satisfies z.ZodType<PlanSession>;

export const planViewSchema = z.object({
  sessions: z.array(planSessionSchema),
  completedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  nextSessionId: sessionIdSchema.nullable(),
}) satisfies z.ZodType<PlanView>;
```

`src/schemas/coach.ts`:

```ts
import { z } from 'zod';
import { COACH_ROLES, type CoachMessage } from '../domain';

export const coachMessageSchema = z.object({
  id: z.string(),
  role: z.enum(COACH_ROLES),
  text: z.string(),
  createdAt: z.iso.datetime(),
}) satisfies z.ZodType<CoachMessage>;

export const sendCoachMessageBodySchema = z.object({
  text: z
    .string('Type a message first.')
    .trim()
    .min(1, 'Type a message first.')
    .max(500, 'Keep it under 500 characters.'),
});
export type SendCoachMessageBody = z.infer<typeof sendCoachMessageBodySchema>;

export const coachHistoryResponseSchema = z.object({
  messages: z.array(coachMessageSchema),
});
export type CoachHistoryResponse = z.infer<typeof coachHistoryResponseSchema>;

export const sendCoachMessageResponseSchema = z.object({
  message: coachMessageSchema,
  reply: coachMessageSchema,
});
export type SendCoachMessageResponse = z.infer<typeof sendCoachMessageResponseSchema>;
```

`src/schemas/billing.ts`:

```ts
import { z } from 'zod';
import { ENTITLEMENT_TIERS, PRODUCT_IDS, type Entitlement } from '../domain';

export const productIdSchema = z.enum(PRODUCT_IDS, 'Choose a plan.');

export const entitlementSchema = z.object({
  tier: z.enum(ENTITLEMENT_TIERS),
  productId: productIdSchema.nullable(),
  trialEndsAt: z.iso.datetime().nullable(),
}) satisfies z.ZodType<Entitlement>;

export const mockPurchaseBodySchema = z.object({
  productId: productIdSchema,
});
export type MockPurchaseBody = z.infer<typeof mockPurchaseBodySchema>;
```

`src/schemas/error.ts`:

```ts
import { z } from 'zod';
import { ERROR_CODES, type ApiError } from '../domain';

export const apiErrorSchema = z.object({
  code: z.enum(ERROR_CODES),
  message: z.string(),
}) satisfies z.ZodType<ApiError>;
```

- [ ] **Step 6: Write the routes and the barrel**

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

```ts
export * from './domain';
export * from './routes';
export * from './schemas/auth';
export * from './schemas/billing';
export * from './schemas/coach';
export * from './schemas/error';
export * from './schemas/me';
export * from './schemas/plan';
```

- [ ] **Step 7: Run the smoke test to verify it passes**

Run: `pnpm --filter @forge/contracts test`
Expected: `tests 3`, `pass 1`, `skipped 2` (the two per-app checks skip until Tasks 3–4
scaffold the apps), `fail 0`.

- [ ] **Step 8: Typecheck and format**

Run: `pnpm --filter @forge/contracts typecheck && pnpm exec prettier --check "packages/contracts/**/*.{ts,cjs,json}"`
Expected: no output from `tsc`; Prettier reports all files formatted.

- [ ] **Step 9: Record decisions**

Append to `docs/decisions/plan-0.md`:

```markdown
- Contracts compile with `module`/`moduleResolution: nodenext` and no `"type"` field, so the output is CommonJS · one build works for Nest (CJS) and Metro · none
- `onboardingBodySchema.acceptConsent` is `z.boolean().pipe(z.literal(true))` · react-hook-form needs a boolean input for the checkbox, while the API still only accepts `true` · none
- `newPasswordSchema` checks UTF-8 byte length (≤ 72) with a local helper instead of TextEncoder · bcrypt truncates at 72 bytes, and the contracts compile without DOM or Node lib types · none
- The per-app smoke checks skip until the app's package.json exists · Plan 0 builds contracts before the apps exist · a skipped check could hide a missing app; Task 4 requires 0 skipped
```

- [ ] **Step 10: Commit**

```bash
git add packages/contracts pnpm-lock.yaml docs/decisions/plan-0.md
git commit -m "feat(contracts): domain types, zod schemas and route constants"
```

---

### Task 3: `apps/api` skeleton — config, database, error envelope, validation pipe

**Files:**
- Generate: `apps/api/**` with `nest new` (then delete: `.prettierrc`, `README.md`,
  `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts`,
  `test/app.e2e-spec.ts`)
- Replace: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`,
  `apps/api/src/app.module.ts`, `apps/api/src/main.ts`
- Modify: `apps/api/eslint.config.mjs` (ignore `dist`)
- Create: `apps/api/src/config.ts`, `src/config.module.ts`, `src/db/schema.ts`,
  `src/db/db.module.ts`
- Create: `apps/api/src/common/app-error.ts`, `http-error.filter.ts`, `zod-validation.pipe.ts`
- Test: `apps/api/src/common/zod-validation.pipe.spec.ts`,
  `apps/api/src/common/http-error.filter.spec.ts`
- Create: `apps/api/drizzle.config.ts`, `apps/api/.env.example`
- Create: `apps/api/test/test-env.ts`, `test/global-setup.ts`, `test/setup-env.ts`,
  `test/jest-e2e.json`, `test/app.e2e-spec.ts`

**Interfaces:**
- Consumes: from `@forge/contracts`, the tuples `GOALS`, `PRODUCT_IDS` and `COACH_ROLES`, the
  types `ErrorCode` and `ApiError`, and `signupBodySchema` (in the pipe test).
- Produces (Plan A builds on these exact names):
  - **Config:** `APP_CONFIG` (DI token), `AppConfig`
    `{ DATABASE_URL; JWT_SECRET; PORT; COACH_LATENCY_MIN_MS; COACH_LATENCY_MAX_MS }`,
    `loadConfig(env?)`, and the global `ConfigModule` that exports `APP_CONFIG`.
  - **Database:** `DB` (DI token), `Database = PostgresJsDatabase<typeof schema>`, and the global
    `DbModule` that exports `DB`.
  - **Tables in `db/schema.ts`:** `users`, `userGoals`, `coachMessages`, `entitlements`, plus
    the enums `goalEnum`, `productIdEnum`, `coachRoleEnum`.
  - **Errors:** `AppError(code: ErrorCode, message: string)` with a readonly `code`;
    `STATUS_BY_CODE`; `toErrorResponse(exception)` → `{ status, body: ApiError }`; and
    `HttpErrorFilter`, registered through `APP_FILTER`.
  - **Validation:** `ZodValidationPipe<TSchema>(schema)`, used as
    `@Body(new ZodValidationPipe(schema))`.
  - **e2e harness:** `test/jest-e2e.json` with `globalSetup` (runs `drizzle-kit push --force`
    against `forge_test`) and `setupFiles` (test env: coach latency 0, and a `JWT_SECRET`
    default so no `.env` is needed).

- [ ] **Step 1: Scaffold with the Nest CLI (non-interactive)**

Run: `npx -y @nestjs/cli@11.0.24 new --help`
Expected: the flags `--directory`, `--skip-git`, `--skip-install`, `--package-manager` and
`--strict` are listed.

Run: `npx -y @nestjs/cli@11.0.24 new api --directory apps/api --skip-git --skip-install --package-manager pnpm --strict`
Expected: `CREATE apps/api/...` lines for 14 files, and no prompt.

- [ ] **Step 2: Remove the sample code and replace the manifest and tsconfigs**

Run: `rm apps/api/.prettierrc apps/api/README.md apps/api/src/app.controller.ts apps/api/src/app.service.ts apps/api/src/app.controller.spec.ts apps/api/test/app.e2e-spec.ts`

Replace `apps/api/package.json`. This drops ts-loader, ts-node, tsconfig-paths,
source-map-support and @types/express, which are not in the approved set, and adds the approved
API dependencies:

```json
{
  "name": "@forge/api",
  "version": "0.0.1",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "typecheck": "tsc --noEmit",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json --runInBand",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@forge/contracts": "workspace:*",
    "@nestjs/common": "^11.2.6",
    "@nestjs/core": "^11.2.6",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/platform-express": "^11.2.6",
    "bcryptjs": "^3.0.3",
    "drizzle-orm": "^0.45.3",
    "postgres": "^3.4.9",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.7",
    "@eslint/js": "^9.39.5",
    "@nestjs/cli": "^11.0.24",
    "@nestjs/schematics": "^11.1.0",
    "@nestjs/testing": "^11.2.6",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.19.0",
    "@types/supertest": "^7.2.1",
    "drizzle-kit": "^0.31.11",
    "eslint": "^9.39.5",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.6",
    "globals": "^17.12.0",
    "jest": "^30.5.2",
    "prettier": "^3.9.9",
    "supertest": "^7.3.0",
    "ts-jest": "^29.4.14",
    "typescript": "~6.0.3",
    "typescript-eslint": "^8.71.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "roots": ["<rootDir>/src"],
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.ts$": "ts-jest"
    },
    "testEnvironment": "node"
  }
}
```

Replace `apps/api/tsconfig.json` and `apps/api/tsconfig.build.json`:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "rootDir": ".",
    "outDir": "./dist",
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "types": [
      "node",
      "jest"
    ]
  },
  "include": [
    "src",
    "test",
    "drizzle.config.ts"
  ]
}
```

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

In `apps/api/eslint.config.mjs`, change `ignores: ['eslint.config.mjs'],` to
`ignores: ['eslint.config.mjs', 'dist'],`.

Run: `pnpm install`
Expected: install succeeds; `pnpm --filter @forge/api exec nest --version` prints `11.x`.

- [ ] **Step 3: Write the failing tests for the pipe and the error mapping**

```ts
import { signupBodySchema } from '@forge/contracts';
import { ZodValidationPipe } from './zod-validation.pipe';

function thrownBy(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the action to throw');
}

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(signupBodySchema);

  it('returns the parsed, normalised value', () => {
    expect(pipe.transform({ email: ' Alex@Example.com ', password: 'correct horse' })).toEqual({
      email: 'alex@example.com',
      password: 'correct horse',
    });
  });

  it('throws VALIDATION_FAILED carrying the first issue message as user-facing copy', () => {
    expect(
      thrownBy(() => pipe.transform({ email: 'nope', password: 'correct horse' })),
    ).toMatchObject({ code: 'VALIDATION_FAILED', message: 'Enter a valid email address.' });
  });
});
```

```ts
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppError } from './app-error';
import { toErrorResponse } from './http-error.filter';

describe('toErrorResponse', () => {
  it('maps an AppError to the status for its code and keeps its message', () => {
    expect(toErrorResponse(new AppError('SESSION_LOCKED', 'Finish Foundation first.'))).toEqual({
      status: 409,
      body: { code: 'SESSION_LOCKED', message: 'Finish Foundation first.' },
    });
  });

  it.each([
    [new BadRequestException(), 400, 'VALIDATION_FAILED'],
    [new UnauthorizedException(), 401, 'UNAUTHORIZED'],
    [new NotFoundException(), 404, 'NOT_FOUND'],
  ])('maps Nest exception %p to %i %s', (exception, status, code) => {
    expect(toErrorResponse(exception)).toMatchObject({ status, body: { code } });
  });

  it('hides anything unexpected behind a generic 500', () => {
    for (const exception of [new Error('db exploded'), new ForbiddenException(), 'boom']) {
      expect(toErrorResponse(exception)).toEqual({
        status: 500,
        body: { code: 'INTERNAL', message: 'Something went wrong.' },
      });
    }
  });
});
```

- [ ] **Step 4: Run them to verify they fail**

Run: `pnpm --filter @forge/contracts build && pnpm --filter @forge/api test`
Expected: FAIL with `Cannot find module './zod-validation.pipe'` and
`Cannot find module './http-error.filter'`.

- [ ] **Step 5: Implement `AppError`, the filter and the pipe**

```ts
import type { ErrorCode } from '@forge/contracts';

// Thrown by domain services. HttpErrorFilter turns it into `{ code, message }` with the
// status from STATUS_BY_CODE, so services never deal with HTTP.
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

```ts
import type { ApiError, ErrorCode } from '@forge/contracts';
import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { AppError } from './app-error';

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  PLUS_REQUIRED: 403,
  NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  SESSION_LOCKED: 409,
  INTERNAL: 500,
};

export interface ErrorResponse {
  status: number;
  body: ApiError;
}

export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof AppError) {
    return {
      status: STATUS_BY_CODE[exception.code],
      body: { code: exception.code, message: exception.message },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 400) {
      return {
        status,
        body: { code: 'VALIDATION_FAILED', message: 'The request could not be read.' },
      };
    }
    if (status === 401) {
      return { status, body: { code: 'UNAUTHORIZED', message: 'Please sign in again.' } };
    }
    if (status === 404) {
      return { status, body: { code: 'NOT_FOUND', message: 'Not found.' } };
    }
  }
  return { status: 500, body: { code: 'INTERNAL', message: 'Something went wrong.' } };
}

interface JsonResponse {
  status(code: number): { json(body: unknown): unknown };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : exception,
      );
    }
    host.switchToHttp().getResponse<JsonResponse>().status(status).json(body);
  }
}
```

```ts
import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { AppError } from './app-error';

// Validates and normalises input with a @forge/contracts schema. The first issue's message
// is user-facing copy, so it goes straight into the 400 body.
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform<
  unknown,
  z.output<TSchema>
> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_FAILED',
        result.error.issues[0]?.message ?? 'Invalid request.',
      );
    }
    return result.data;
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @forge/api test`
Expected: PASS: 2 suites, 7 tests.

- [ ] **Step 7: Config, database module and Drizzle schema**

```ts
import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  PORT: z.coerce.number().int().positive().default(3000),
  COACH_LATENCY_MIN_MS: z.coerce.number().int().min(0).default(600),
  COACH_LATENCY_MAX_MS: z.coerce.number().int().min(0).default(1200),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment:\n${problems.join('\n')}`);
  }
  return result.data;
}
```

```ts
import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, loadConfig } from './config';

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
```

```ts
import { COACH_ROLES, GOALS, PRODUCT_IDS } from '@forge/contracts';
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Enum values come from the contracts tuples, so database and wire values cannot drift.
export const goalEnum = pgEnum('goal', GOALS);
export const productIdEnum = pgEnum('product_id', PRODUCT_IDS);
export const coachRoleEnum = pgEnum('coach_role', COACH_ROLES);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    consentAcceptedAt: timestamp('consent_accepted_at', { withTimezone: true }),
    // Decision A: the only plan state. Session statuses are derived from it.
    completedCount: integer('completed_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('users_completed_count_non_negative', sql`${table.completedCount} >= 0`)],
);

export const userGoals = pgTable(
  'user_goals',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goal: goalEnum('goal').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.goal] })],
);

export const coachMessages = pgTable(
  'coach_messages',
  {
    // Identity, not uuid: insertion order is conversation order, even when timestamps tie.
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: coachRoleEnum('role').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('coach_messages_user_id_id_idx').on(table.userId, table.id)],
);

// A row exists if and only if the user has Plus.
export const entitlements = pgTable('entitlements', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: productIdEnum('product_id').notNull(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }).notNull(),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
});
```

```ts
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { APP_CONFIG, type AppConfig } from '../config';
import * as schema from './schema';

export const DB = Symbol('DB');
const SQL_CLIENT = Symbol('SQL_CLIENT');

export type Database = PostgresJsDatabase<typeof schema>;

// Supabase's transaction pooler (port 6543) does not support prepared statements.
export function usesTransactionPooler(databaseUrl: string): boolean {
  return new URL(databaseUrl).port === '6543';
}

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) =>
        postgres(config.DATABASE_URL, { prepare: !usesTransactionPooler(config.DATABASE_URL) }),
    },
    {
      provide: DB,
      inject: [SQL_CLIENT],
      useFactory: (client: postgres.Sql): Database => drizzle({ client, schema }),
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly client: postgres.Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
```

- [ ] **Step 8: App module, bootstrap, Drizzle config, env example**

`apps/api/src/app.module.ts` (Plan A adds the feature modules):

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpErrorFilter } from './common/http-error.filter';
import { ConfigModule } from './config.module';
import { DbModule } from './db/db.module';

@Module({
  imports: [ConfigModule, DbModule],
  providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
})
export class AppModule {}
```

```ts
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadConfig } from './config';

async function bootstrap(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  // 0.0.0.0 so a phone on the same Wi-Fi (EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000) can connect.
  await app.listen(config.PORT, '0.0.0.0');
}

void bootstrap();
```

```ts
import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (copy apps/api/.env.example to apps/api/.env)');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: { url },
});
```

```dotenv
# Local Postgres from the root docker-compose.yml
DATABASE_URL=postgres://forge:forge@localhost:5432/forge
TEST_DATABASE_URL=postgres://forge:forge@localhost:5432/forge_test
# At least 32 characters. Any value works locally.
JWT_SECRET=local-dev-secret-change-me-0123456789
PORT=3000
# Simulated coach "thinking" time, in milliseconds
COACH_LATENCY_MIN_MS=600
COACH_LATENCY_MAX_MS=1200
```

- [ ] **Step 9: e2e harness and the envelope smoke test**

```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_TEST_DATABASE_URL = 'postgres://forge:forge@localhost:5432/forge_test';

// e2e always runs against the separate forge_test database, with no coach latency.
// Works without apps/api/.env; values from it are used when present.
export function applyTestEnv(): void {
  const envFile = join(__dirname, '..', '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  process.env.JWT_SECRET ??= 'e2e-secret-that-is-at-least-32-characters';
  process.env.COACH_LATENCY_MIN_MS = '0';
  process.env.COACH_LATENCY_MAX_MS = '0';
}
```

```ts
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { applyTestEnv } from './test-env';

// Syncs the Drizzle schema into forge_test once per `pnpm test:e2e` run.
export default function globalSetup(): void {
  applyTestEnv();
  execSync('pnpm exec drizzle-kit push --force', {
    cwd: join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
```

```ts
import { applyTestEnv } from './test-env';

applyTestEnv();
```

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.ts$": "ts-jest"
  },
  "globalSetup": "<rootDir>/global-setup.ts",
  "setupFiles": ["<rootDir>/setup-env.ts"]
}
```

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers an unknown route with the JSON error shape', async () => {
    const response = await request(app.getHttpServer()).get('/nope').expect(404);
    expect(response.body).toEqual({ code: 'NOT_FOUND', message: 'Not found.' });
  });
});
```

- [ ] **Step 10: Push the schema and run the e2e smoke**

Run: `cp apps/api/.env.example apps/api/.env` (if port 3000 is taken, change `PORT` in
`apps/api/.env`; see Execution notes).

Run: `docker compose up -d --wait && pnpm db:push`
Expected: `[✓] Changes applied`. The tables `users`, `user_goals`, `coach_messages` and
`entitlements` now exist in `forge`.

Run: `pnpm test:e2e`
Expected: drizzle-kit pushes to `forge_test`, then PASS: 1 suite, 1 test ("answers an
unknown route with the JSON error shape").

- [ ] **Step 11: Boot it and check that repeated builds still emit `main.js` (Review Focus #5)**

Run: `pnpm --filter @forge/api build && touch apps/api/src/main.ts && pnpm --filter @forge/api build && ls apps/api/dist/main.js`
Expected: `apps/api/dist/main.js` exists after the second build.

Run: `(cd apps/api && node dist/main.js > /dev/null 2>&1 &) ; sleep 2; curl -s localhost:3000/nope; pkill -f "node dist/main.js"`
Expected: `{"code":"NOT_FOUND","message":"Not found."}`. If you changed `PORT` in
`apps/api/.env`, curl that port instead.

- [ ] **Step 12: Gate**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all turbo tasks succeed.

- [ ] **Step 13: Record decisions**

Append to `docs/decisions/plan-0.md`:

```markdown
- API `tsconfig.json` sets `rootDir: "."`, and the build config sets `rootDir: "./src"` · TypeScript 6 errors (TS5011) when `outDir` is set without `rootDir`, which broke ts-jest · none
- `incremental` removed from the API tsconfig · with Nest's `deleteOutDir`, the `tsbuildinfo` kept outside `dist/` made a rebuild skip `dist/main.js` · slightly slower `nest build`
- Nest template extras (ts-loader, ts-node, tsconfig-paths, source-map-support, @types/express) removed · not in the approved dependency set, and unused; the filter types its response structurally · none
- `.env` loads through `process.loadEnvFile()` in `main.ts`, `drizzle.config.ts` and `test/test-env.ts` · Node 24 built-in, no dotenv · none
- e2e runs without `apps/api/.env` (the test env defaults `TEST_DATABASE_URL` and `JWT_SECRET`) · reviewers can run `pnpm test:e2e` right after `docker compose up` · none
```

- [ ] **Step 14: Commit**

```bash
git add apps/api pnpm-lock.yaml docs/decisions/plan-0.md
git commit -m "feat(api): nest skeleton with config, drizzle schema, error envelope and zod pipe"
```

---

### Task 4: `apps/mobile` skeleton — Expo Router, Uniwind, HeroUI Native in Expo Go

**Files:**
- Generate: `apps/mobile/**` with `create-expo-app` (then delete: `.git`, `App.tsx`,
  `index.ts`, `LICENSE`)
- Replace: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`
- Create: `apps/mobile/metro.config.js`, `eslint.config.js`, `.env.example`
- Create: `apps/mobile/src/global.css`, `src/env.d.ts`, `src/app/_layout.tsx`,
  `src/app/index.tsx`
- Generate and commit: `apps/mobile/src/uniwind-types.d.ts`

**Interfaces:**
- Consumes: `@forge/contracts` (as a workspace dependency; nothing imported yet).
- Produces for Plan B:
  - `src/app` is the Expo Router root.
  - The `@/*` path alias maps to `src/*`.
  - `src/global.css` is the Uniwind CSS entry, imported by the root layout.
  - Provider stack: `GestureHandlerRootView` → `KeyboardProvider` → `HeroUINativeProvider`.
  - `src/env.d.ts` declares `*.css` modules and references `expo/types`
    (`process.env.EXPO_PUBLIC_*`).

- [ ] **Step 1: Scaffold with create-expo-app (non-interactive)**

Run: `npx -y create-expo-app@latest --help`
Expected: `--template`, `--no-install` and `--no-agents-md` are listed.

Run: `npx -y create-expo-app@latest apps/mobile --template blank-typescript@sdk-57 --no-install --no-agents-md`
Expected: "Your project is ready!", with no prompt.

`--no-agents-md` stops it from writing its own `CLAUDE.md`, `AGENTS.md` and
`.claude/settings.json`. The generator also runs `git init` inside the new folder, so remove
that nested repository, along with the template's files.

Run: `rm -rf apps/mobile/.git && rm apps/mobile/App.tsx apps/mobile/index.ts apps/mobile/LICENSE && ls -A apps/mobile`
Expected: `.gitignore  app.json  assets  package.json  tsconfig.json`.

- [ ] **Step 2: Replace the manifest, then install through Expo**

Replace `apps/mobile/package.json` with the following: the package name, the Expo Router entry
point, scripts and the workspace dependency. The template's own dependencies stay; Expo adds
the rest in a moment.

```json
{
  "name": "@forge/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@forge/contracts": "workspace:*",
    "expo": "~57.0.25",
    "expo-status-bar": "~57.0.1",
    "react": "19.2.3",
    "react-native": "0.86.3"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  }
}
```

Run: `pnpm install`
Expected: the install succeeds and Expo's packages appear under the root `node_modules`.

Run each of the following from the repo root.

The native modules, with versions chosen by Expo for SDK 57:
`(cd apps/mobile && CI=1 npx expo install expo-router expo-constants expo-linking expo-splash-screen expo-system-ui expo-secure-store expo-haptics @expo/vector-icons react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated react-native-worklets react-native-svg react-native-keyboard-controller @react-native-async-storage/async-storage)`
Expected: `Added config plugins: expo-router, expo-splash-screen, expo-secure-store`.

The lint toolchain (dev): `(cd apps/mobile && CI=1 npx expo install eslint eslint-config-expo -- -D)`
Expected: install succeeds.

The JS-only libraries: `pnpm --filter @forge/mobile add heroui-native uniwind tailwindcss tailwind-variants tailwind-merge @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister zustand react-hook-form @hookform/resolvers zod`
Expected: install succeeds with no new "Ignored build scripts" warning.

Expected `apps/mobile/package.json` dependencies after these commands (versions verified on
2026-09-29; patch versions may differ):

```json
{
  "name": "@forge/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@expo/vector-icons": "^15.1.1",
    "@forge/contracts": "workspace:*",
    "@hookform/resolvers": "^5.9.1",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@tanstack/query-async-storage-persister": "^5.104.0",
    "@tanstack/react-query": "^5.104.0",
    "@tanstack/react-query-persist-client": "^5.104.0",
    "expo": "~57.0.25",
    "expo-constants": "~57.0.19",
    "expo-haptics": "~57.0.3",
    "expo-linking": "~57.0.11",
    "expo-router": "~57.0.23",
    "expo-secure-store": "~57.0.4",
    "expo-splash-screen": "~57.0.9",
    "expo-status-bar": "~57.0.1",
    "expo-system-ui": "~57.0.4",
    "heroui-native": "^1.0.10",
    "react": "19.2.3",
    "react-hook-form": "^7.89.0",
    "react-native": "0.86.3",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-keyboard-controller": "1.21.9",
    "react-native-reanimated": "4.5.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.2",
    "react-native-svg": "15.15.4",
    "react-native-worklets": "0.10.1",
    "tailwind-merge": "^3.7.0",
    "tailwind-variants": "^3.3.1",
    "tailwindcss": "^4.3.3",
    "uniwind": "^1.12.0",
    "zod": "^4.6.5",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "eslint": "^9.39.5",
    "eslint-config-expo": "~57.0.2",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 3: Replace `app.json` and `tsconfig.json`**

`expo install` added config plugins to `app.json`; this version keeps them and sets the app
identity and automatic light/dark:

```json
{
  "expo": {
    "name": "Forge",
    "slug": "forge",
    "scheme": "forge",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": false
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash-icon.png",
          "imageWidth": 120,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": { "backgroundColor": "#000000" }
        }
      ]
    ]
  }
}
```

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: Metro + Uniwind, global CSS, type shims, ESLint, env example**

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Must be the outermost wrapper. Paths are relative to apps/mobile (Metro runs from there).
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
```

```css
@import 'tailwindcss';
@import 'uniwind';
@import 'heroui-native/styles';
```

```ts
/// <reference types="expo/types" />

// Lets TypeScript accept `import '../global.css'`; Uniwind's Metro transformer handles the file.
declare module '*.css';
```

```js
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'src/uniwind-types.d.ts'],
  },
]);
```

```dotenv
# Where the app finds the API.
#   iOS Simulator:     http://localhost:3000
#   Android emulator:  http://10.0.2.2:3000
#   Phone on Wi-Fi:    http://<your computer's LAN IP>:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 5: Placeholder root layout and screen**

`apps/mobile/src/app/_layout.tsx`:

```tsx
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Plan 0 placeholder: the provider stack only. Plan B, Task B1 replaces this file.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
```

`apps/mobile/src/app/index.tsx`:

```tsx
import { Button, Card, Typography } from 'heroui-native';
import { View } from 'react-native';

// Plan 0 placeholder: proves Uniwind + HeroUI Native render in Expo Go, in light and dark.
// Plan B, Task B1 deletes it.
export default function Placeholder() {
  return (
    <View className="flex-1 justify-center gap-4 bg-background px-6">
      <Typography.Heading type="h1">Forge</Typography.Heading>
      <Card>
        <Card.Body>
          <Card.Title>Scaffold ready</Card.Title>
          <Card.Description>HeroUI Native and Uniwind are wired up.</Card.Description>
        </Card.Body>
        <Card.Footer>
          <Button onPress={() => {}}>Looks good</Button>
        </Card.Footer>
      </Card>
    </View>
  );
}
```

- [ ] **Step 6: Bundle once (this also generates `src/uniwind-types.d.ts`)**

Run: `cd apps/mobile && npx expo export --platform ios --output-dir "$(mktemp -d)"`
Expected: `iOS Bundled`, then `Exported: ...`. `apps/mobile/src/uniwind-types.d.ts` now exists
and declares `themes: readonly ['light', 'dark']`.

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm --filter @forge/mobile typecheck && pnpm --filter @forge/mobile lint`
Expected: no errors. Without `src/env.d.ts`, TypeScript 6 fails on `import '../global.css'`
with TS2882.

- [ ] **Step 8: See it in Expo Go (mobile-self-check, no API needed)**

Follow the `mobile-self-check` skill, with these adjustments:
- Only the Expo step applies: run `npx expo start --ios` from `apps/mobile`, in the background.
  The first run downloads Expo Go (see Execution notes).
- Save the screenshots to the session scratchpad, not `docs/screenshots/`. This placeholder
  isn't a product screen.

Verify in light, then run `xcrun simctl ui booted appearance dark` and verify dark:
- The heading "Forge", the HeroUI `Card` (title and description) and the primary `Button`
  render with the default HeroUI theme.
- The background follows the system appearance (`bg-background`).
- Metro logs no errors.

Run `xcrun simctl ui booted appearance light` afterwards, then stop the Expo process.

- [ ] **Step 9: Contracts smoke check from both apps (0 skipped)**

Run: `pnpm --filter @forge/contracts test`
Expected: `tests 3`, `pass 3`, `skipped 0`.

- [ ] **Step 10: Gate**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all turbo tasks succeed (contracts, api, mobile).

- [ ] **Step 11: Record decisions**

Append to `docs/decisions/plan-0.md`:

```markdown
- `create-expo-app --no-agents-md`, and delete the nested `.git` it creates · it otherwise writes its own CLAUDE.md, AGENTS.md and .claude/settings.json and a git repo inside ours · none
- `src/env.d.ts` references `expo/types` and declares `*.css` · TypeScript 6 errors on unknown side-effect imports, and Expo's generated `expo-env.d.ts` is git-ignored · none
- `src/uniwind-types.d.ts` is committed · `pnpm typecheck` must pass on a fresh clone before Metro has ever run · regenerate it if themes change
- Metro and Expo always run from `apps/mobile` (the package scripts already do) · Uniwind resolves `cssEntryFile` against `process.cwd()` · styles missing if run from the repo root
- The first `expo start --ios` downloads Expo Go SDK 57 (~550 MB) · no App Store build for SDK 57 on simulators · a slow first run, only once
```

- [ ] **Step 12: Commit**

```bash
git add apps/mobile pnpm-lock.yaml docs/decisions/plan-0.md
git commit -m "feat(mobile): expo sdk 57 skeleton with expo router, uniwind and heroui native"
```

---

### Task 5: HeroUI Native agent skill, README skeleton, final gate

**Files:**
- Create: `.claude/skills/heroui-native/**` (installed)
- Create: `README.md`
- Modify: `docs/decisions/plan-0.md`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - The `heroui-native` skill, which Plan B implementers use for component APIs.
  - `README.md`, which Plan A (API section) and Plan B (screenshots, "one more hour") extend.

- [ ] **Step 1: Read the installer, then install the skill project-scoped**

Run: `curl -fsSL https://heroui.com/install -o "$(mktemp -d)/heroui-install.sh"`. Read the
script before running it: it should only download skill files into `.claude/skills/`. If it
does anything else, stop and ask.

Run: `curl -fsSL https://heroui.com/install | HEROUI_SKILL_SCOPE=project bash -s heroui-native`
Expected: `.claude/skills/heroui-native/SKILL.md` exists.

Run: `ls .claude/skills && git status --short .claude`
Expected: `heroui-native` and `mobile-self-check`; only new files under
`.claude/skills/heroui-native/`.

- [ ] **Step 2: Write the README skeleton**

Plan A adds the API details and Plan B adds the screenshots and "What I'd change with one more
hour"; everything else is final now.

````markdown
# Forge

> **Loom walkthrough:** _link coming with the final submission_

Forge is a private training companion: sign up, pick your goals, and work through a
three-session plan that unlocks in order — Foundation, Build, Forge. Progress lives on the
server, so the order can't be skipped and survives a reinstall; a cached copy makes a cold
launch paint instantly. A coach chat, behind a mocked paywall, answers with your name, goals
and progress.

## Prerequisites

- Node 24 via nvm (`nvm use` reads `.nvmrc`)
- pnpm 10 via corepack (`corepack enable`; the repo pins `pnpm@10.34.5`)
- Docker (for Postgres 16)
- Xcode with an iOS Simulator (or an Android emulator) and Expo Go — Expo CLI installs Expo Go
  on the simulator for you

## Quick start

```bash
pnpm i
docker compose up -d --wait
cp apps/api/.env.example apps/api/.env
pnpm db:push
pnpm dev:api      # in one terminal
pnpm dev:mobile   # in another, then press i
```

`pnpm db:push` applies the Drizzle schema directly (`drizzle-kit push`). With one schema
version and no production data, migration files would add nothing; a real deployment would
switch to `drizzle-kit generate` + `migrate`.

## Running on a device

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` (copy `apps/mobile/.env.example`):

- iOS Simulator: `http://localhost:3000` (the default)
- Android emulator: `http://10.0.2.2:3000`
- Phone on the same Wi-Fi: `http://<your computer's LAN IP>:3000` — the API listens on
  `0.0.0.0`

At SDK 57's launch, the App Store build of Expo Go lagged behind the SDK. If your phone's Expo
Go can't open the project, use `eas go` or the simulator.

## Tests

```bash
pnpm test        # contracts smoke test + API unit tests (in-memory adapters, no database)
pnpm test:e2e    # API end-to-end against the docker-compose Postgres (forge_test)
```

## Architecture

- `packages/contracts` — the only shared code: domain types, zod schemas (with the user-facing
  validation copy) and route constants.
- `apps/api` — NestJS 11. Each module is controller → service → repository port → Drizzle
  adapter; services are unit-tested against in-memory adapters. Postgres 16 via Drizzle.
- `apps/mobile` — Expo SDK 57, Expo Router, HeroUI Native + Uniwind, TanStack Query (plan and
  profile persisted for an instant cold start) and Zustand (JWT in SecureStore).
- Design: [`docs/superpowers/specs/2026-09-28-forge-design.md`](docs/superpowers/specs/2026-09-28-forge-design.md).
  Rulings made while building: [`docs/decisions/`](docs/decisions/).
````

- [ ] **Step 3: Final gate for Plan 0**

Run: `pnpm i && pnpm build && pnpm typecheck && pnpm lint && pnpm test`
Expected: all turbo tasks succeed.

Run: `docker compose up -d --wait && pnpm db:push && pnpm test:e2e`
Expected: PASS: 1 suite, 1 test.

- [ ] **Step 4: Record decisions**

Append to `docs/decisions/plan-0.md`:

```markdown
- heroui-native skill installed project-scoped and committed (D31) · implementers and reviewers see the same component guidance · vendor files in `.claude/skills/heroui-native/`
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/heroui-native README.md docs/decisions/plan-0.md
git commit -m "docs: readme skeleton and heroui-native agent skill"
```

After this commit, `packages/contracts` is frozen: Plans A and B may import from it but not
change it.
