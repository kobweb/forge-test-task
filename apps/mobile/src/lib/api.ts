import { apiErrorSchema, type ErrorCode } from '@forge/contracts';
import type { z } from 'zod';
import { useSession } from '@/stores/session-store';
import { API_URL } from './config';

export type ApiErrorCode = ErrorCode | 'NETWORK';

/** Every failed request becomes one of these; `message` is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const TIMEOUT_MS = 15_000;

let handleUnauthorized: () => void = () => {};

/** Called when a request that carried a token gets 401 (expired token, deleted account). */
export function setUnauthorizedHandler(handler: () => void): void {
  handleUnauthorized = handler;
}

/** JSON request whose response is parsed with a @forge/contracts schema. */
export async function apiRequest<T>(
  method: Method,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  const response = await send(method, path, body);
  return schema.parse(await response.json());
}

/** Request whose success response has no body (204). */
export async function apiRequestNoContent(method: Method, path: string): Promise<void> {
  await send(method, path, undefined);
}

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

async function send(method: Method, path: string, body: unknown): Promise<Response> {
  const token = useSession.getState().token;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('NETWORK', "Can't reach Forge. Check your connection and try again.", null);
  } finally {
    clearTimeout(timeout);
  }
  if (response.ok) return response;

  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));
  // Only while that token is still current: concurrent or late 401s must not sign out twice.
  if (response.status === 401 && token && useSession.getState().token === token) {
    handleUnauthorized();
  }
  throw parsed.success
    ? new ApiError(parsed.data.code, parsed.data.message, response.status)
    : new ApiError('INTERNAL', 'Something went wrong. Please try again.', response.status);
}
