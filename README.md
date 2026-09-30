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

Mobile: no automated tests by design (TDD exemption). Each screen was checked in the iOS
Simulator (iPhone 16, light and dark), and sign-in, onboarding and the Plan also on an Android
emulator; see the screenshots.

API details (endpoints, env vars, structure): [apps/api/README.md](apps/api/README.md).
Mobile details (running it, structure): [apps/mobile/README.md](apps/mobile/README.md).

## Screenshots

All from an iPhone 16 simulator; the full set is in [`docs/screenshots/`](docs/screenshots/).

| | |
| --- | --- |
| **Sign in**<br><img src="docs/screenshots/sign-in.png" width="300" alt="Sign in"> | **Onboarding**<br><img src="docs/screenshots/onboarding.png" width="300" alt="Onboarding"> |
| **Plan**<br><img src="docs/screenshots/plan.png" width="300" alt="Plan"> | **Session, ready to complete**<br><img src="docs/screenshots/session-ready.png" width="300" alt="Session ready"> |
| **Plan complete**<br><img src="docs/screenshots/plan-complete.png" width="300" alt="Plan complete"> | **Coach chat**<br><img src="docs/screenshots/coach-chat.png" width="300" alt="Coach chat"> |
| **Paywall**<br><img src="docs/screenshots/paywall.png" width="300" alt="Paywall"> | **Settings**<br><img src="docs/screenshots/settings.png" width="300" alt="Settings"> |
| **Plan (dark)**<br><img src="docs/screenshots/plan-dark.png" width="300" alt="Plan, dark"> | **Coach chat (dark)**<br><img src="docs/screenshots/coach-chat-dark.png" width="300" alt="Coach chat, dark"> |

## Architecture

- `packages/contracts` — the only shared code: domain types, zod schemas (with the user-facing
  validation copy) and route constants.
- `apps/api` — NestJS 11. Each module is controller → service → repository port → Drizzle
  adapter; services are unit-tested against in-memory adapters. Postgres 16 via Drizzle.
- `apps/mobile` — Expo SDK 57, Expo Router, HeroUI Native + Uniwind, TanStack Query (plan and
  profile persisted for an instant cold start) and Zustand (JWT in SecureStore).
- Design: [`docs/superpowers/specs/2026-09-28-forge-design.md`](docs/superpowers/specs/2026-09-28-forge-design.md).
  Rulings made while building: [`docs/decisions/`](docs/decisions/).

## What I'd change with one more hour

- On the headerless tab screens (Plan, Settings) the content scrolls straight under the
  status-bar clock. A fading top edge or a collapsing title would keep the clock legible
  while scrolling.
- Toasts appear at the top and, for the few seconds they show, sit over the controls there:
  the session screen's back button and the paywall's close button. Placing them below the header
  on those screens would keep navigation within reach while the message shows.
- Tapping "Start training" on an empty onboarding form grows every field with its error and
  pushes the button below the fold. Scrolling to the first invalid field on submit would keep
  the person looking at what needs fixing instead of at a half-hidden button.

## Supabase instead of Docker (optional)

Set `DATABASE_URL` in `apps/api/.env` to your Supabase connection string, then run
`pnpm db:push`. On the transaction pooler (port 6543) the API switches prepared statements off
by itself (postgres.js `prepare: false`); direct and session-pooler connections work as they
are. The e2e suite still runs against the local `forge_test` database (`TEST_DATABASE_URL`).
