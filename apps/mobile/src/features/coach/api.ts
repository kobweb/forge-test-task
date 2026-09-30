import {
  coachHistoryResponseSchema,
  routes,
  sendCoachMessageResponseSchema,
  type CoachMessage,
  type SendCoachMessageResponse,
} from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

export function useCoachMessages() {
  return useQuery<CoachMessage[], ApiError>({
    queryKey: queryKeys.coachMessages,
    queryFn: async () =>
      (await apiRequest('GET', routes.coach.messages, coachHistoryResponseSchema)).messages,
  });
}

// Optimistic: the user's bubble shows at once; on failure it is rolled back and the screen
// puts the text back into the composer.
export function useSendCoachMessage() {
  return useMutation<SendCoachMessageResponse, ApiError, string, { previous: CoachMessage[] }>({
    mutationFn: (text) =>
      apiRequest('POST', routes.coach.messages, sendCoachMessageResponseSchema, { text }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.coachMessages });
      const previous = queryClient.getQueryData<CoachMessage[]>(queryKeys.coachMessages) ?? [];
      const pending: CoachMessage = {
        id: `pending-${Date.now()}`,
        role: 'user',
        text,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<CoachMessage[]>(queryKeys.coachMessages, [...previous, pending]);
      return { previous };
    },
    onError: (error, _text, context) => {
      if (context) queryClient.setQueryData(queryKeys.coachMessages, context.previous);
      analytics.track('coach_send_failed', { code: error.code });
    },
    onSuccess: ({ message, reply }, _text, context) => {
      queryClient.setQueryData<CoachMessage[]>(queryKeys.coachMessages, [
        ...(context?.previous ?? []),
        message,
        reply,
      ]);
      analytics.track('coach_reply_received');
    },
  });
}
