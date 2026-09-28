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
