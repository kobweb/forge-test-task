import type { Goal } from '@forge/contracts';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  goals: Goal[]; // in GOALS order
  consentAcceptedAt: Date | null;
  createdAt: Date;
}

export interface NewUser {
  email: string;
  passwordHash: string;
}

export interface UserChanges {
  displayName?: string;
  goals?: Goal[]; // replaces the whole set
  consentAcceptedAt?: Date;
}

export interface UsersRepository {
  /** Throws AppError EMAIL_TAKEN when the email is already registered. */
  create(user: NewUser): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /** Applies the changes and returns the updated user, or null when it doesn't exist. */
  update(id: string, changes: UserChanges): Promise<UserRecord | null>;
  delete(id: string): Promise<void>;
}
