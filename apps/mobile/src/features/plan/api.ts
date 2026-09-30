import { planViewSchema, routes, type PlanView, type SessionId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useChecklist } from '@/stores/checklist-store';
import { useSession } from '@/stores/session-store';

export function usePlan() {
  const token = useSession((state) => state.token);
  return useQuery<PlanView, ApiError>({
    queryKey: queryKeys.plan,
    queryFn: () => apiRequest('GET', routes.plan.get, planViewSchema),
    enabled: token !== null,
  });
}

// The server decides what unlocks; its answer replaces the cached plan. The checklist ticks are
// cleared here, at hook level, because TanStack skips a `mutate()` call's own callbacks once the
// calling screen has unmounted (the user backed out during a slow request), which would leave
// the completed session pre-ticked for the next run of the plan.
export function useCompleteSession() {
  return useMutation<PlanView, ApiError, SessionId>({
    mutationFn: (sessionId) => apiRequest('POST', routes.plan.complete(sessionId), planViewSchema),
    onSuccess: (plan, sessionId) => {
      queryClient.setQueryData(queryKeys.plan, plan);
      useChecklist.getState().clear(sessionId);
      analytics.track('session_completed', { sessionId, completedCount: plan.completedCount });
      if (plan.nextSessionId === null) analytics.track('plan_completed');
    },
  });
}

// A restart starts every session from a blank checklist, including one whose completion the
// client never saw succeed (a timed-out request the server still applied).
export function useResetPlan() {
  return useMutation<PlanView, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.plan.reset, planViewSchema),
    onSuccess: (plan) => {
      queryClient.setQueryData(queryKeys.plan, plan);
      useChecklist.getState().reset();
      analytics.track('plan_restarted');
    },
  });
}
