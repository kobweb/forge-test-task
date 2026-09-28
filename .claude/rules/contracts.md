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
