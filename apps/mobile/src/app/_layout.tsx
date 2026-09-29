import '../global.css';
import '@/lib/session'; // registers the 401 → sign-out handler

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useIsRestoring } from '@tanstack/react-query';
import { Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { NoticeToaster } from '@/components/notice-toaster';
import { ScreenState } from '@/components/screen-state';
import { useMe } from '@/features/me/api';
import { useNavigationTheme } from '@/lib/navigation-theme';
import { persistOptions, queryClient } from '@/lib/query-client';
import { useSession, useSessionHydrated } from '@/stores/session-store';

void SplashScreen.preventAutoHideAsync();

// Last-resort screen for a render error anywhere below. Plain RN + Uniwind tokens only, so it
// renders even when the providers above are what failed.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
      <Text className="text-center text-xl font-semibold text-foreground">
        Something went wrong
      </Text>
      <Text className="text-center text-base text-muted">
        Try again. If it keeps happening, restart the app.
      </Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        className="rounded-full bg-accent px-6 py-3"
      >
        <Text className="font-semibold text-accent-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <NoticeToaster />
            <RootNavigator />
            <StatusBar style="auto" />
          </PersistQueryClientProvider>
        </HeroUINativeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const navigationTheme = useNavigationTheme();
  const sessionHydrated = useSessionHydrated();
  const restoringCache = useIsRestoring();
  const signedIn = useSession((state) => state.token !== null);
  const me = useMe();

  // The splash stays up until we know which stack to show: token read, cache restored, and
  // (for a signed-in user without a cached profile) the first GET /me settled. A retry after
  // that first failure keeps the error screen up instead of returning to a blank window.
  const ready =
    sessionHydrated && !restoringCache && !(signedIn && me.isPending && me.errorUpdateCount === 0);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  if (signedIn && !me.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't reach Forge"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void me.refetch()}
        isActionPending={me.isFetching}
      />
    );
  }

  const onboarded = me.data?.onboarded === true;
  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="session/[id]"
            options={{
              headerShown: true,
              title: '',
              headerBackTitle: 'Plan',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: true,
              title: 'Edit profile',
              headerBackTitle: 'Settings',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
