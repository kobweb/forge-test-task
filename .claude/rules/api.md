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
