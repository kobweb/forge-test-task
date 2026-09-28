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
