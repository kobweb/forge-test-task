import { planViewSchema, routes, type PlanView, type SessionId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useSession } from '@/stores/session-store';

export function usePlan() {
  const token = useSession((state) => state.token);
  return useQuery<PlanView, ApiError>({
    queryKey: queryKeys.plan,
    queryFn: () => apiRequest('GET', routes.plan.get, planViewSchema),
    enabled: token !== null,
  });
}

// The server decides what unlocks; its answer replaces the cached plan.
export function useCompleteSession() {
  return useMutation<PlanView, ApiError, SessionId>({
    mutationFn: (sessionId) => apiRequest('POST', routes.plan.complete(sessionId), planViewSchema),
    onSuccess: (plan) => queryClient.setQueryData(queryKeys.plan, plan),
  });
}

export function useResetPlan() {
  return useMutation<PlanView, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.plan.reset, planViewSchema),
    onSuccess: (plan) => queryClient.setQueryData(queryKeys.plan, plan),
  });
}
