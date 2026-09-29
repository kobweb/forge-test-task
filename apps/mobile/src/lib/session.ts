import type { AuthResponse } from '@forge/contracts';
import { usePlanCelebration } from '@/stores/celebration-store';
import { useChecklist } from '@/stores/checklist-store';
import { useSession } from '@/stores/session-store';
import { setUnauthorizedHandler } from './api';
import { publishNotice } from './notices';
import { persister, queryClient, queryKeys } from './query-client';

const SIGN_OUT_NOTICES = {
  expired: 'Your session ended. Please sign in again.',
  deleted: 'Your account and data were deleted.',
} as const;

// Everything cached belongs to one user, so it is wiped whenever the user changes.
async function clearUserData(): Promise<void> {
  queryClient.clear();
  await persister.removeClient();
  useChecklist.getState().reset();
  usePlanCelebration.setState({ pending: null });
}

export async function signIn({ token, user }: AuthResponse): Promise<void> {
  await clearUserData();
  queryClient.setQueryData(queryKeys.me, user);
  useSession.getState().setToken(token);
}

export async function signOut(reason?: keyof typeof SIGN_OUT_NOTICES): Promise<void> {
  // Token first: the route guards leave the signed-in screens before their data disappears.
  useSession.getState().setToken(null);
  await clearUserData();
  if (reason) publishNotice(SIGN_OUT_NOTICES[reason]);
}

setUnauthorizedHandler(() => {
  void signOut('expired');
});
