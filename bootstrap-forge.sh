#!/usr/bin/env bash
set -euo pipefail

mkdir -p .claude/rules .claude/skills/mobile-self-check docs/decisions

touch docs/decisions/.gitkeep

cat > .claude/settings.json <<'EOF'
{
  "permissions": {
    "allow": ["Bash(*)", "Read(*)", "Edit(*)", "Write(*)", "WebFetch(*)"],
    "deny": [
      "Bash(git push*)",
      "Bash(git reset --hard*)",
      "Bash(git rebase*)",
      "Bash(rm -rf /*)",
      "Bash(rm -rf ~*)"
    ]
  }
}
EOF

cat > CLAUDE.md <<'EOF'
# Forge

Take-home for a Senior Full-Stack (React Native / Node) role: a private training companion —
email+password auth, a 3-session plan with sequential unlocking, a coach chat behind a mocked
paywall. Reviewers judge UI taste and whether the author can explain any file; they do not
grade architecture or coverage. A finished small slice beats a half-built platform.
Product rules, API surface and the decisions already made: `docs/product.md` (read once
before designing; the approved spec in `docs/superpowers/specs/` then becomes the authority).

## Runtime
Node 24 via nvm (`.nvmrc`; `nvm alias default 24` is set), pnpm 10. On a Node-version error
or a missing `pnpm`, re-run as `source ~/.nvm/nvm.sh && nvm use 24 && <cmd>`; never work
around it. Long-running processes (docker compose, API dev server, `expo start`) run in the
background; never block a step on them.

## Layout (Turborepo + pnpm workspaces, `nodeLinker: hoisted`)
- `packages/contracts` — `@forge/contracts`: domain types + zod schemas + route constants;
  the only code shared by both apps. Frozen once Plan 0 is on main.
- `apps/api` — NestJS 11 + Drizzle + Postgres (docker-compose locally; Supabase optional).
- `apps/mobile` — Expo + Expo Router + HeroUI Native/Uniwind + TanStack Query + Zustand.
Per-area conventions live in `.claude/rules/` and load when you touch those files.

## Commands (root)
`pnpm i` · `pnpm dev:api` · `pnpm dev:mobile` · `pnpm build` · `pnpm test` · `pnpm test:e2e`
(needs `docker compose up -d`) · `pnpm typecheck` · `pnpm lint`

## Process (superpowers is installed; these override its defaults)
- One short architectural brainstorm (decisions in `docs/product.md` are final) → one spec →
  three plans (0 foundation incl. scaffolding, A api, B mobile) → executed back-to-back with
  superpowers:subagent-driven-development, directly on `main` (explicit consent: no
  worktrees, no branches). Implementers on `sonnet` when the brief holds the complete code,
  `fable` for integration tasks; every reviewer on `fable`. No pauses between tasks or plans.
- Scaffolding is non-interactive: check `--help`; a generator that insists on prompts is
  replaced by its non-interactive equivalent, never by waiting for input.
- Never add a dependency outside the rules files / approved spec without asking.
- Record every non-obvious decision or ruling as one line in `docs/decisions/<plan>.md`:
  what / why / cost if wrong.
EOF

cat > .claude/rules/git.md <<'EOF'
Conventional Commits (`feat(api): …`, `feat(mobile): …`, `feat(contracts): …`, `chore:`,
`docs:`), one commit per task, never rewrite history, never push. `.gitignore` covers
node_modules, dist, .turbo, .expo, .env, .superpowers, .worktrees, .heroui-docs.
EOF

cat > .claude/rules/contracts.md <<'EOF'
---
paths:
  - "packages/contracts/**"
---
# @forge/contracts
- `src/domain.ts`: hand-written domain types/enums reused verbatim by both apps (Goal,
  SessionStatus, EntitlementTier, User, PlanSession, PlanView, CoachMessage, Entitlement,
  ApiError).
- `src/schemas/<module>.ts` (auth, me, plan, coach, billing): zod v4 schemas for every request
  body and response. Body/response TS types are inferred; response schemas are declared with
  `satisfies z.ZodType<DomainType>` so schema and domain type cannot drift.
- `src/routes.ts`: typed route constants (`routes.plan.complete(id)`).
- Build: `tsc` → `dist/` as CommonJS + declarations; `exports` points at `dist`; `dev` =
  `tsc --watch`. One smoke test proves both apps can import the package.
- Nothing else is shared between apps.
EOF

cat > .claude/rules/api.md <<'EOF'
---
paths:
  - "apps/api/**"
---
# apps/api
- NestJS 11, REST/JSON. Bearer auth everywhere except `/auth/*`. Error body `{ code, message }`.
  Every resource is scoped by the JWT `userId`; deleting the account deletes everything.
- Drizzle ORM, `postgres` driver via `drizzle-orm/postgres-js`, `prepare: false` when the URL
  is a Supabase transaction pooler. drizzle-kit; `db:push` is acceptable (say so in README).
  `docker-compose.yml` = local Postgres 16 for dev, e2e and reviewers; `.env.example` points
  at it. Auth: `@nestjs/jwt` + `bcryptjs`. Validation: a small zod ValidationPipe fed by
  `@forge/contracts`.
- Layers per module (auth, users, plan, coach, billing): controller → domain service →
  repository port (interface + DI token) → Drizzle adapter. In-memory adapters live in test
  code. No extra layers.
- TDD scope (explicit permission for superpowers:test-driven-development):
  REQUIRED red → green → refactor for every domain service — auth, onboarding + consent, plan
  progression (order, locking, idempotent complete, reset, per-user isolation), coach reply,
  mock entitlement — using in-memory adapters; plus 3–5 supertest e2e flows against the
  docker-compose Postgres. EXEMPT: module wiring, `main.ts`, config, Drizzle schema and
  migrations, Dockerfile, README.
- Plan state: `users.completedCount`; statuses derived from the static template (see
  `docs/product.md`, decision A).
EOF

cat > .claude/rules/mobile.md <<'EOF'
---
paths:
  - "apps/mobile/**"
---
# apps/mobile
- Expo (latest stable SDK), Expo Router, HeroUI Native + Uniwind (Tailwind v4). Must run in
  Expo Go on the iOS Simulator and an Android emulator: nothing that needs a dev client (no
  MMKV, no Nitro modules, no native code of our own). Use the `heroui-native` skill for
  components; check docs.uniwind.dev (append `.md`) before assuming className behaviour.
- Server state: TanStack Query v5 + `react-query-persist-client` + `query-async-storage-
  persister`; persist only the `plan` and `me` queries (`shouldDehydrateQuery`, `buster` = app
  version). Client state: Zustand v5 + `persist`; JWT via a storage adapter over
  `expo-secure-store`. Forms: react-hook-form + `@hookform/resolvers` with contracts schemas.
  Motion: reanimated. Haptics: expo-haptics. API base URL: `EXPO_PUBLIC_API_URL`.
- No tests required here (TDD exemption). After each task that ships a screen, run the
  `mobile-self-check` skill instead.
- UI bar (graded): default HeroUI Native theme, system light/dark, no custom theme now.
  Intentionality through composition: one primary action per screen; spacing/colour only via
  HeroUI/Uniwind tokens (no hard-coded values); designed empty/loading/error states; clearly
  distinct locked / open / completed treatments; sticky "Next session" CTA (safe-area aware);
  unlock + complete motion with haptic; keyboard-aware forms with inline errors; considered
  copy. Every screen must look finished on an iPhone 15/16 simulator.
EOF

cat > .claude/skills/mobile-self-check/SKILL.md <<'EOF'
---
name: mobile-self-check
description: Visual self-review of an Expo screen in the iOS Simulator after implementing it — boots API and Expo, screenshots the screen, compares it with the UI bar, fixes and re-shoots. Use after every task that ships or changes a mobile screen.
---
1. Ensure services are up (background): `docker compose up -d`; `pnpm dev:api` (needs
   `apps/api/.env`, copy from `.env.example`); `npx expo start --ios` inside `apps/mobile`
   (installs/launches Expo Go on the booted simulator).
2. Drive the app far enough to reach the screen (sign up with a fresh email, complete
   sessions as needed). Do not skip states: capture empty, loading (if reachable) and error
   variants when the task introduced them.
3. `xcrun simctl io booted screenshot docs/screenshots/<screen>[-<state>].png`, then Read the
   PNG and compare it against the UI bar in `.claude/rules/mobile.md`: hierarchy, safe areas,
   keyboard overlap, truncation, state treatments, CTA placement.
4. Fix what is off, re-shoot, keep only the final image per screen/state. Note anything you
   chose not to fix in `docs/decisions/mobile.md`.
5. Android: only in the final walkthrough task, if `emulator -list-avds` shows one; otherwise
   state that in `apps/mobile/README.md`.
EOF

cat > docs/product.md <<'EOF'
# Forge — product rules and decisions (source for the spec)

## Scope (final)
1. Auth: signup + login (email + password), JWT in expo-secure-store, logout, delete account.
2. Onboarding after signup: display name, one goal (Get stronger / Move daily / Build a
   habit), required consent checkbox → `consentAcceptedAt`. Skipped when already onboarded.
3. Plan: 3 abstract sessions — "Foundation", "Build", "Forge" — each with title, subtitle,
   duration and 3–4 blocks (Warm-up / Main set / Finisher / Cool-down) shown as a checklist;
   "Complete session" button; "Plan complete" state with Restart.
4. Coach: request/response chat, persisted history per user, deterministic fake model that
   references name, goal and progress, 600–1200 ms simulated latency, suggested prompts as
   tappable chips in the empty state. Gated by entitlement `free | plus`: paywall with two
   mock products, "Start 7-day trial", "Restore purchases", "Sandbox · no real charge".
5. Settings: name, goal, consent date, logout, delete account & data (with confirmation).
6. Root README: Loom link placeholder at the top, prerequisites (Node 24 via nvm, pnpm 10,
   Docker, Expo Go), docker compose, API, app on simulator and on a device via
   EXPO_PUBLIC_API_URL (Android emulator: 10.0.2.2), tests, screenshots, links to
   docs/decisions/, "What I'd change with one more hour" (three concrete UI items).
Cut order if scope must go: paywall → coach → settings. Never cut auth, the plan with
lock/unlock that survives reload, or the Plan screen.

## Rules
- Their data only: every resource scoped by the JWT `userId`; users never see each other's
  plan, messages or entitlement.
- Plan order is enforced on the server; the client only renders status. Progress persists on
  the server and is cached locally so a cold launch paints instantly, then re-syncs.
- Session 1 starts open; completing N unlocks N+1; completing a locked session → 409;
  completing a completed one → 200 no-op.

## API surface
POST /auth/signup · POST /auth/login · GET /me · PATCH /me · DELETE /me ·
GET /plan · POST /plan/sessions/:id/complete · POST /plan/reset ·
GET /coach/messages · POST /coach/messages ·
GET /billing/entitlement · POST /billing/mock-purchase · POST /billing/mock-restore

## Decisions already made (do not re-open)
- A. `users.completedCount` (int, default 0); statuses derived from the template: index <
  count → completed, == count → open, > count → locked. `complete(id)`: index == count →
  count+1 (200); < → 200 no-op; > → 409 `SESSION_LOCKED`. `reset` → 0. No per-session rows.
- B. Reload: persist the TanStack Query cache for `plan` and `me` only. Server is the source
  of truth; the cache only makes the first frame instant.
- C. Coach transport: plain request/response. No streaming.
- D. Plan screen: vertical timeline — three cards joined by a connector, greeting + progress
  (n/3) header, sticky "Next session" CTA. Completed: check glyph, muted. Open: accent border
  + "Up next". Locked: lock glyph inline with "Unlocks after Session N", muted title, full
  opacity, lower elevation. On return after a completion the newly open card animates once
  (border/scale) with a haptic.
EOF

git add -A
git commit -q -m "docs: project instructions for Claude Code"
echo "forge/ ready: $(git rev-parse --short HEAD)"
