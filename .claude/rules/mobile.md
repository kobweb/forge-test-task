---
paths:
  - "apps/mobile/**"
---
# apps/mobile
- Expo (latest stable SDK), Expo Router, HeroUI Native + Uniwind (Tailwind v4). Must run in
  Expo Go on the iOS Simulator and an Android emulator: nothing that needs a dev client (no
  MMKV, no Nitro modules, no native code of our own). Use the `heroui-native` skill for
  components; check docs.uniwind.dev (append `.md`) before assuming className behaviour.
- Server state: TanStack Query v5 + `react-query-persist-client` + `query-async-storage-
  persister`; persist only the `plan` and `me` queries (`shouldDehydrateQuery`, `buster` = app
  version). Client state: Zustand v5 + `persist`; JWT via a storage adapter over
  `expo-secure-store`. Forms: react-hook-form + `@hookform/resolvers` with contracts schemas.
  Motion: reanimated. Haptics: expo-haptics. API base URL: `EXPO_PUBLIC_API_URL`.
- No tests required here (TDD exemption). After each task that ships a screen, run the
  `mobile-self-check` skill instead.
- UI bar (graded): default HeroUI Native theme, system light/dark, no custom theme now.
  Intentionality through composition: one primary action per screen; spacing/colour only via
  HeroUI/Uniwind tokens (no hard-coded values); designed empty/loading/error states; clearly
  distinct locked / open / completed treatments; sticky "Next session" CTA (safe-area aware);
  unlock + complete motion with haptic; keyboard-aware forms with inline errors; considered
  copy. Every screen must look finished on an iPhone 15/16 simulator.
