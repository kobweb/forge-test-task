import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { AppState } from 'react-native';
import { ApiError } from './api';
import { APP_VERSION } from './config';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const queryKeys = {
  me: ['me'],
  plan: ['plan'],
  entitlement: ['entitlement'],
  coachMessages: ['coach', 'messages'],
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: WEEK_MS, // must outlive maxAge, or restored queries are dropped
      // Retry network and server hiccups, never 4xx answers.
      retry: (failureCount, error) =>
        failureCount < 2 &&
        !(error instanceof ApiError && error.status !== null && error.status < 500),
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'forge.query-cache',
});

// Decision B: persist only `me` and `plan`, so a cold launch paints instantly, then re-syncs.
const PERSISTED_KEYS = new Set<unknown>([queryKeys.me[0], queryKeys.plan[0]]);

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: WEEK_MS,
  buster: APP_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && PERSISTED_KEYS.has(query.queryKey[0]),
  },
};

// Refetch stale queries when the app returns to the foreground.
AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
