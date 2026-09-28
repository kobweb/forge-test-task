import type { UpdateMeBody, User } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import {
  USERS_REPOSITORY,
  type UserChanges,
  type UserRecord,
  type UsersRepository,
} from './users.repository';

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly users: UsersRepository) {}

  async getMe(userId: string): Promise<User> {
    return toUser(await this.requireUser(userId));
  }

  async updateMe(userId: string, body: UpdateMeBody): Promise<User> {
    const current = await this.requireUser(userId);
    const changes: UserChanges = {};
    if (body.displayName !== undefined) changes.displayName = body.displayName;
    if (body.goals !== undefined) changes.goals = body.goals;
    // Consent is a fact with a date: set once, never overwritten (deleting the account revokes it).
    if (body.acceptConsent && current.consentAcceptedAt === null) {
      changes.consentAcceptedAt = new Date();
    }
    const updated = await this.users.update(userId, changes);
    if (!updated) throw signInAgain();
    return toUser(updated);
  }

  async deleteMe(userId: string): Promise<void> {
    await this.users.delete(userId);
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) throw signInAgain();
    return user;
  }
}

export function toUser(record: UserRecord): User {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    goals: record.goals,
    consentAcceptedAt: record.consentAcceptedAt?.toISOString() ?? null,
    onboarded:
      record.displayName !== null && record.goals.length > 0 && record.consentAcceptedAt !== null,
  };
}

function signInAgain(): AppError {
  return new AppError('UNAUTHORIZED', 'Please sign in again.');
}
