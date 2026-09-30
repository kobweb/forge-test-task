import { routes, userSchema, type UpdateMeBody, type User } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, apiRequestNoContent, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { signOut } from '@/lib/session';
import { useSession } from '@/stores/session-store';

export function useMe() {
  const token = useSession((state) => state.token);
  return useQuery<User, ApiError>({
    queryKey: queryKeys.me,
    queryFn: () => apiRequest('GET', routes.me, userSchema),
    enabled: token !== null,
  });
}

export function useUpdateMe() {
  return useMutation<User, ApiError, UpdateMeBody>({
    mutationFn: (body) => apiRequest('PATCH', routes.me, userSchema, body),
    onSuccess: (user, body) => {
      queryClient.setQueryData(queryKeys.me, user);
      // Only the onboarding form sends the consent; the edit-profile form never does.
      analytics.track(body.acceptConsent ? 'onboarding_completed' : 'profile_updated', {
        goalCount: user.goals.length,
      });
    },
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiRequestNoContent('DELETE', routes.me),
    onSuccess: () => {
      // Tracked before the sign-out resets the consent, so a consenting user's last event lands.
      analytics.track('account_deleted');
      return signOut('deleted');
    },
  });
}
