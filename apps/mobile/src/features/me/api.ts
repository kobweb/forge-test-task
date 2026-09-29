import { routes, userSchema, type UpdateMeBody, type User } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
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
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiRequestNoContent('DELETE', routes.me),
    onSuccess: () => signOut('deleted'),
  });
}
