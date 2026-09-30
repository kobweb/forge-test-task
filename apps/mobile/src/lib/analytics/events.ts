import type { ProductId, SessionId, SessionStatus } from '@forge/contracts';

export type PermissionKind = 'notifications' | 'analytics' | 'tracking';
export type PermissionResult = 'granted' | 'denied' | 'skipped';
export type PaywallSource = 'coach_teaser' | 'settings' | 'direct';

// Every event the app can send, with its properties. Ids, counts and codes only: never an
// email, a name or message text.
export interface AnalyticsEvents {
  app_opened: undefined;
  screen_viewed: { path: string };
  sign_up_completed: undefined;
  sign_in_completed: undefined;
  auth_failed: { flow: 'sign_up' | 'sign_in'; code: string };
  onboarding_completed: { goalCount: number };
  permission_prompt_viewed: { kind: PermissionKind };
  permission_result: { kind: PermissionKind; result: PermissionResult };
  session_opened: { sessionId: SessionId; status: SessionStatus };
  session_completed: { sessionId: SessionId; completedCount: number };
  plan_completed: undefined;
  plan_restarted: undefined;
  coach_teaser_viewed: undefined;
  paywall_viewed: { source: PaywallSource };
  product_selected: { productId: ProductId };
  trial_started: { productId: ProductId };
  purchase_failed: { code: string };
  restore_completed: { restored: boolean };
  coach_message_sent: { source: 'prompt' | 'typed' };
  coach_reply_received: undefined;
  coach_send_failed: { code: string };
  profile_updated: { goalCount: number };
  logged_out: undefined;
  account_deleted: undefined;
}

export type EventName = keyof AnalyticsEvents;

/** `track('app_opened')` takes no properties; `track('screen_viewed', { path })` requires them. */
export type PropsOf<E extends EventName> = AnalyticsEvents[E] extends undefined
  ? []
  : [props: AnalyticsEvents[E]];
