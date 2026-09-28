# Plan 0 — decisions (what · why · cost if wrong)

- pnpm pinned with `packageManager: pnpm@10.34.5` · corepack otherwise resolves pnpm 12 on this machine · none
- `onlyBuiltDependencies`: @parcel/watcher, esbuild, unrs-resolver · pnpm 10 skips build scripts and `approve-builds` is interactive · a newly added native-binary package may need to be added here
- turbo `lint` depends on `^build` (the spec's §3 lists lint without it) · type-aware ESLint in the API needs the contracts' `.d.ts` · slightly slower cold lint
- turbo `agentGuidance: false` · turbo 2.11 writes an AGENTS.md at the repo root in agent sessions, which dirties the tree after every gate and competes with CLAUDE.md · none
- Contracts compile with `module`/`moduleResolution: nodenext` and no `"type"` field, so the output is CommonJS · one build works for Nest (CJS) and Metro · none
- `onboardingBodySchema.acceptConsent` is `z.boolean().pipe(z.literal(true))` · react-hook-form needs a boolean input for the checkbox, while the API still only accepts `true` · none
- `newPasswordSchema` checks UTF-8 byte length (≤ 72) with a local helper instead of TextEncoder · bcrypt truncates at 72 bytes, and the contracts compile without DOM or Node lib types · none
- The per-app smoke checks skip until the app's package.json exists · Plan 0 builds contracts before the apps exist · a skipped check could hide a missing app; Task 4 requires 0 skipped
- API `tsconfig.json` sets `rootDir: "."`, and the build config sets `rootDir: "./src"` · TypeScript 6 errors (TS5011) when `outDir` is set without `rootDir`, which broke ts-jest · none
- `incremental` removed from the API tsconfig · with Nest's `deleteOutDir`, the `tsbuildinfo` kept outside `dist/` made a rebuild skip `dist/main.js` · slightly slower `nest build`
- Nest template extras (ts-loader, ts-node, tsconfig-paths, source-map-support, @types/express) removed · not in the approved dependency set, and unused; the filter types its response structurally · none
- `.env` loads through `process.loadEnvFile()` in `main.ts`, `drizzle.config.ts` and `test/test-env.ts` · Node 24 built-in, no dotenv · none
- e2e runs without `apps/api/.env` (the test env defaults `TEST_DATABASE_URL` and `JWT_SECRET`) · reviewers can run `pnpm test:e2e` right after `docker compose up` · none
