# @forge/api

NestJS 11 REST API for Forge, on Postgres 16 via Drizzle. Every route except `/auth/*` needs
`Authorization: Bearer <jwt>`, and every query is scoped by the token's user id. Errors always
look like `{ "code": "...", "message": "..." }`, and `message` is safe to show to a user.

## Run it

From the repo root:

```bash
docker compose up -d --wait
cp apps/api/.env.example apps/api/.env
pnpm db:push
pnpm dev:api
```

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | — (`.env.example`: docker-compose `forge`) | Postgres connection. A Supabase transaction pooler (port 6543) automatically disables prepared statements. |
| `TEST_DATABASE_URL` | docker-compose `forge_test` | e2e only |
| `JWT_SECRET` | — (≥ 32 chars) | HS256 signing key; tokens last 30 days |
| `PORT` | `3000` | Listens on `0.0.0.0`, so phones on the LAN can connect |
| `COACH_LATENCY_MIN_MS` / `COACH_LATENCY_MAX_MS` | `600` / `1200` | Simulated coach "thinking" time |

## Endpoints

| Endpoint | Auth | Success | Notable errors |
|---|---|---|---|
| `POST /auth/signup` | public | 201 `{ token, user }` | 409 `EMAIL_TAKEN` |
| `POST /auth/login` | public | 200 `{ token, user }` | 401 `INVALID_CREDENTIALS` |
| `GET /me` · `PATCH /me` · `DELETE /me` | bearer | 200 user · 200 user · 204 | 400 `VALIDATION_FAILED` (PATCH) |
| `GET /plan` | bearer | 200 plan | — |
| `POST /plan/sessions/:id/complete` | bearer | 200 plan (a repeat is a no-op) | 404 `SESSION_NOT_FOUND`, 409 `SESSION_LOCKED` |
| `POST /plan/reset` | bearer | 200 plan | — |
| `GET /coach/messages` · `POST /coach/messages` | bearer | 200 history · 201 `{ message, reply }` | 403 `PLUS_REQUIRED` |
| `GET /billing/entitlement` · `POST /billing/mock-purchase` · `POST /billing/mock-restore` | bearer | 200 entitlement | 400 `VALIDATION_FAILED` (mock-purchase) |

## How it's built

- **One module per area** (users, auth, plan, billing, coach): controller → service →
  repository port → Drizzle adapter (auth has no repository of its own and uses the users port).
  Controllers only do HTTP; services hold the rules and throw `AppError(code)`; the global
  `HttpErrorFilter` maps codes to statuses.
- **Plan progress is one number** (`users.completed_count`). Statuses are derived from the
  static three-session template. Completing is a compare-and-set, so a double tap can't skip
  a session.
- **Validation** uses the `@forge/contracts` zod schemas through `ZodValidationPipe`. The
  schemas' messages are the copy the app shows.
- **The coach** is a pure, deterministic `composeCoachReply()` (name + goals + progress), with
  an injected delay. Both coach endpoints require Plus, and the server enforces that.

## Tests

```bash
pnpm test        # unit: every service against in-memory adapters (test/in-memory), no database
pnpm test:e2e    # supertest against forge_test (schema pushed by the Jest global setup)
```

Decisions and trade-offs: [`docs/decisions/plan-a.md`](../../docs/decisions/plan-a.md), and the
spec in `docs/superpowers/specs/`.
