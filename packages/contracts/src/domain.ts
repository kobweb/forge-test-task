export const GOALS = ['get_stronger', 'move_daily', 'build_habit'] as const;
export type Goal = (typeof GOALS)[number];

export const SESSION_IDS = ['foundation', 'build', 'forge'] as const;
export type SessionId = (typeof SESSION_IDS)[number];

export const SESSION_STATUSES = ['completed', 'open', 'locked'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const BLOCK_KINDS = ['warm_up', 'main_set', 'finisher', 'cool_down'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const ENTITLEMENT_TIERS = ['free', 'plus'] as const;
export type EntitlementTier = (typeof ENTITLEMENT_TIERS)[number];

export const PRODUCT_IDS = ['forge_plus_monthly', 'forge_plus_yearly'] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export const COACH_ROLES = ['user', 'coach'] as const;
export type CoachRole = (typeof COACH_ROLES)[number];

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'INVALID_CREDENTIALS',
  'PLUS_REQUIRED',
  'NOT_FOUND',
  'SESSION_NOT_FOUND',
  'EMAIL_TAKEN',
  'SESSION_LOCKED',
  'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// Timestamps cross the wire as ISO 8601 strings.
export interface User {
  id: string; // uuid; JWT `sub`
  email: string; // lowercased
  displayName: string | null;
  goals: Goal[]; // a set in GOALS order; [] until onboarding
  consentAcceptedAt: string | null;
  onboarded: boolean; // name, >= 1 goal and consent all set; computed by the API
}

export interface SessionBlock {
  kind: BlockKind;
  title: string;
  detail: string;
}

export interface PlanSession {
  id: SessionId;
  number: number; // 1-based position in the plan
  title: string;
  subtitle: string;
  durationMinutes: number;
  blocks: SessionBlock[];
  status: SessionStatus;
}

export interface PlanView {
  sessions: PlanSession[]; // template order
  completedCount: number; // 0..totalCount
  totalCount: number;
  nextSessionId: SessionId | null; // the open session; null when the plan is complete
}

export interface CoachMessage {
  id: string;
  role: CoachRole;
  text: string;
  createdAt: string;
}

export interface Entitlement {
  tier: EntitlementTier;
  productId: ProductId | null; // null when free
  trialEndsAt: string | null; // null when free
}

export interface ApiError {
  code: ErrorCode;
  message: string;
}
