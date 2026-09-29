import {
  authResponseSchema,
  routes,
  type AuthResponse,
  type LoginBody,
  type SignupBody,
} from '@forge/contracts';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '@/lib/api';
import { signIn } from '@/lib/session';

export function useSignIn() {
  return useMutation<AuthResponse, ApiError, LoginBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.login, authResponseSchema, body),
    onSuccess: signIn,
  });
}

export function useSignUp() {
  return useMutation<AuthResponse, ApiError, SignupBody>({
    mutationFn: (body) => apiRequest('POST', routes.auth.signup, authResponseSchema, body),
    onSuccess: signIn,
  });
}
