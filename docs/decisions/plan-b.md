# Plan B — decisions (what · why · cost if wrong)

- The API client exposes `apiRequest(method, path, schema, body?)` and `apiRequestNoContent` instead of the spec's single `request()` sketch · a schema is required whenever a body is expected, so every response is parsed (D27) · none
- `signOut()` clears the token first, then the caches · the route guards leave signed-in screens before their queries lose data · none
- Notices published outside React (401 → "session ended", deletion) are shown by `<NoticeToaster />` · HeroUI's `useToast()` only works inside the provider · none
- React Navigation's theme is built from HeroUI tokens (`useNavigationTheme`) · headers, the tab bar and screen backgrounds follow light/dark without literals · none
- Tabs import from `expo-router/js-tabs` · the root `Tabs` export is deprecated in Expo Router 57 · none
- The splash uses `expo-splash-screen` directly · expo-router's `SplashScreen` export is marked hidden · none
- The root `ErrorBoundary` uses plain RN + Uniwind classes, not HeroUI · it must render even when the providers are what failed · it looks slightly plainer
- Session hydration uses `useSyncExternalStore` · the React Compiler lint rejects setState inside an effect · none
- A 401 signs out only while the token it carried is still the current one · concurrent requests with an expired token, or a late answer after deleting the account, would otherwise stack "session ended" toasts or sign out the next user · none
- The splash waits only for the first GET /me; a retry keeps the error screen up with "Try again" disabled · after the splash hides, rendering null showed a blank window for the whole retry · none
- Form fields never read `field.ref`; the email → password focus hand-off uses a `useRef` passed as `ref` · the React Compiler lint (`react-hooks/refs`) flags reading the controller's field object · react-hook-form can't focus the first invalid field by itself
- Form layouts use `KeyboardAwareScrollView` (`bottomOffset={144}`) from react-native-keyboard-controller (D20) · the focused field stays visible on every screen size, and the offset also covers the helper line, gap and 56 pt submit button (≈ 102 pt, measured from the caret, which sits ≈ 16 pt above the field's bottom) plus a 24 pt margin, so the button stays visible under the focused last field, even with the form Alert shown · none
- Icon glyph sizes are numeric props, but icon colours always come from className tokens (`withUniwind(Ionicons)`) · Ionicons only accepts a numeric `size`, like HeroUI's own `iconProps` · none
- `FormScreen` calls the scroll view's `assureFocusedInputVisible()` from the fields container's `onLayout` · react-native-keyboard-controller re-scrolls only on keyboard, selection, text and input-height events, so a form Alert or inline error that pushed the focused field down left the submit button under the keyboard (`onContentSizeChange` never fires while the `grow` content is shorter than the screen) · an extra no-op re-check on every fields re-layout
- The onboarding CTA scrolls with the form instead of sticking above the safe area · the resting form fits an iPhone 16 viewport with "Start training" clear of the home indicator, and each helper line adds only ≈ 26 pt, which the scroll view absorbs · on a smaller phone, or with all three helper lines showing, the button needs a short scroll
