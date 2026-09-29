# Plan B — decisions (what · why · cost if wrong)

- The API client exposes `apiRequest(method, path, schema, body?)` and `apiRequestNoContent` instead of the spec's single `request()` sketch · a schema is required whenever a body is expected, so every response is parsed (D27) · none
- `signOut()` clears the token first, then the caches · the route guards leave signed-in screens before their queries lose data · none
- Notices published outside React (401 → "session ended", deletion) are shown by `<NoticeToaster />` · HeroUI's `useToast()` only works inside the provider · none
- React Navigation's theme is built from HeroUI tokens (`useNavigationTheme`) · headers, the tab bar and screen backgrounds follow light/dark without literals · none
- Tabs import from `expo-router/js-tabs` · the root `Tabs` export is deprecated in Expo Router 57 · none
- The splash uses `expo-splash-screen` directly · expo-router's `SplashScreen` export is marked hidden · none
- The root `ErrorBoundary` uses plain RN + Uniwind classes, not HeroUI · it must render even when the providers are what failed · it looks slightly plainer
- Session hydration uses `useSyncExternalStore` · the React Compiler lint rejects setState inside an effect · none
