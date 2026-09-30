import {
  authResponseSchema,
  routes,
  type AuthResponse,
  type LoginBody,
  type SignupBody,
} from '@forge/contracts';
import { useMutation } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { apiRequest, type ApiError } from '@/lib/api';
import { signIn } from '@/lib/session';

export function useSignIn() {
  return useMutation<AuthResponse, ApiError, LoginBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.login, authResponseSchema, body),
    onSuccess: (auth) => {
      analytics.track('sign_in_completed');
      return signIn(auth);
    },
    onError: (error) => analytics.track('auth_failed', { flow: 'sign_in', code: error.code }),
  });
}

export function useSignUp() {
  return useMutation<AuthResponse, ApiError, SignupBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.signup, authResponseSchema, body),
    onSuccess: (auth) => {
      analytics.track('sign_up_completed');
      return signIn(auth);
    },
    onError: (error) => analytics.track('auth_failed', { flow: 'sign_up', code: error.code }),
  });
}
