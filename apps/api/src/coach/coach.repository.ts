import type { CoachRole } from '@forge/contracts';

export const COACH_REPOSITORY = Symbol('COACH_REPOSITORY');

export interface CoachMessageRecord {
  id: number; // identity: insertion order is conversation order
  role: CoachRole;
  text: string;
  createdAt: Date;
}

export interface CoachRepository {
  /** The most recent `limit` messages of this user, oldest first. */
  listRecent(userId: string, limit: number): Promise<CoachMessageRecord[]>;
  append(userId: string, role: CoachRole, text: string): Promise<CoachMessageRecord>;
}
