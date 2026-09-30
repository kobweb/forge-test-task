import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { analytics } from '@/lib/analytics';

export type AnalyticsChoice = 'unknown' | 'granted' | 'denied';

interface PrivacyState {
  analytics: AnalyticsChoice;
  /** The permission steps after onboarding have been walked through on this device. */
  promptsDone: boolean;
  setAnalytics: (choice: 'granted' | 'denied') => void;
  setPromptsDone: () => void;
  reset: () => void;
}

// A failed read counts as "nothing stored": zustand's persist never finishes hydrating on a
// rejection, and the splash waits for it.
const storage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name).catch(() => null),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

// The person's privacy choices. Device-only (the API has no place for them) and reset on
// sign-out, like the rest of that person's data. Every change is pushed into the analytics
// service, which is what actually gates the events.
export const usePrivacy = create<PrivacyState>()(
  persist(
    (set) => ({
      analytics: 'unknown',
      promptsDone: false,
      setAnalytics: (choice) => {
        set({ analytics: choice });
        analytics.setConsent(choice);
      },
      setPromptsDone: () => set({ promptsDone: true }),
      reset: () => {
        set({ analytics: 'unknown', promptsDone: false });
        analytics.reset();
      },
    }),
    {
      name: 'forge.privacy',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ analytics: state.analytics, promptsDone: state.promptsDone }),
      onRehydrateStorage: () => (state) => {
        if (state) analytics.setConsent(state.analytics);
      },
    },
  ),
);

/** True once the choices have been read back from AsyncStorage on launch. */
export function usePrivacyHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => usePrivacy.persist.onFinishHydration(onChange),
    () => usePrivacy.persist.hasHydrated(),
  );
}
