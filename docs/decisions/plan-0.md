# Plan 0 — decisions (what · why · cost if wrong)

- pnpm pinned with `packageManager: pnpm@10.34.5` · corepack otherwise resolves pnpm 12 on this machine · none
- `onlyBuiltDependencies`: @parcel/watcher, esbuild, unrs-resolver · pnpm 10 skips build scripts and `approve-builds` is interactive · a newly added native-binary package may need to be added here
- turbo `lint` depends on `^build` (the spec's §3 lists lint without it) · type-aware ESLint in the API needs the contracts' `.d.ts` · slightly slower cold lint
