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
