import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

// The JWT lives in the Keychain / Keystore, never in AsyncStorage. A failed read counts as "no
// token": zustand's persist never finishes hydrating on a rejection, and the splash waits for it.
const secureStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name).catch(() => null),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

interface SessionState {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: 'forge.session',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ token: state.token }),
    },
  ),
);

/** True once the token has been read back from SecureStore on launch. */
export function useSessionHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSession.persist.onFinishHydration(onChange),
    () => useSession.persist.hasHydrated(),
  );
}
