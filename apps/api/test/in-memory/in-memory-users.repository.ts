import { randomUUID } from 'node:crypto';
import { AppError } from '../../src/common/app-error';
import type {
  NewUser,
  UserChanges,
  UserRecord,
  UsersRepository,
} from '../../src/users/users.repository';

export class InMemoryUsersRepository implements UsersRepository {
  private readonly users = new Map<string, UserRecord>();

  create(user: NewUser): Promise<UserRecord> {
    if ([...this.users.values()].some((existing) => existing.email === user.email)) {
      throw new AppError('EMAIL_TAKEN', 'An account with this email already exists.');
    }
    const record: UserRecord = {
      id: randomUUID(),
      email: user.email,
      passwordHash: user.passwordHash,
      displayName: null,
      goals: [],
      consentAcceptedAt: null,
      createdAt: new Date(),
    };
    this.users.set(record.id, record);
    return Promise.resolve(copy(record));
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    const found = [...this.users.values()].find((user) => user.email === email);
    return Promise.resolve(found ? copy(found) : null);
  }

  findById(id: string): Promise<UserRecord | null> {
    const found = this.users.get(id);
    return Promise.resolve(found ? copy(found) : null);
  }

  update(id: string, changes: UserChanges): Promise<UserRecord | null> {
    const found = this.users.get(id);
    if (!found) return Promise.resolve(null);
    const updated: UserRecord = {
      ...found,
      ...changes,
      goals: changes.goals ? [...changes.goals] : found.goals,
    };
    this.users.set(id, updated);
    return Promise.resolve(copy(updated));
  }

  delete(id: string): Promise<void> {
    this.users.delete(id);
    return Promise.resolve();
  }
}

function copy(user: UserRecord): UserRecord {
  return { ...user, goals: [...user.goals] };
}
