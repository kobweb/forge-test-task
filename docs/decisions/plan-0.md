# Plan 0 — decisions (what · why · cost if wrong)

- pnpm pinned with `packageManager: pnpm@10.34.5` · corepack otherwise resolves pnpm 12 on this machine · none
- `onlyBuiltDependencies`: @parcel/watcher, esbuild, unrs-resolver · pnpm 10 skips build scripts and `approve-builds` is interactive · a newly added native-binary package may need to be added here
- turbo `lint` depends on `^build` (the spec's §3 lists lint without it) · type-aware ESLint in the API needs the contracts' `.d.ts` · slightly slower cold lint
- turbo `agentGuidance: false` · turbo 2.11 writes an AGENTS.md at the repo root in agent sessions, which dirties the tree after every gate and competes with CLAUDE.md · none
- Contracts compile with `module`/`moduleResolution: nodenext` and no `"type"` field, so the output is CommonJS · one build works for Nest (CJS) and Metro · none
- `onboardingBodySchema.acceptConsent` is `z.boolean().pipe(z.literal(true))` · react-hook-form needs a boolean input for the checkbox, while the API still only accepts `true` · none
- `newPasswordSchema` checks UTF-8 byte length (≤ 72) with a local helper instead of TextEncoder · bcrypt truncates at 72 bytes, and the contracts compile without DOM or Node lib types · none
- The per-app smoke checks skip until the app's package.json exists · Plan 0 builds contracts before the apps exist · a skipped check could hide a missing app; Task 4 requires 0 skipped
