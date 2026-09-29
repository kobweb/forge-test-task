import type { CoachRole } from '@forge/contracts';
import type { CoachMessageRecord, CoachRepository } from '../../src/coach/coach.repository';

export class InMemoryCoachRepository implements CoachRepository {
  private nextId = 1;
  private readonly byUser = new Map<string, CoachMessageRecord[]>();

  listRecent(userId: string, limit: number): Promise<CoachMessageRecord[]> {
    const messages = this.byUser.get(userId) ?? [];
    return Promise.resolve(messages.slice(-limit).map((message) => ({ ...message })));
  }

  append(userId: string, role: CoachRole, text: string): Promise<CoachMessageRecord> {
    const message: CoachMessageRecord = { id: this.nextId++, role, text, createdAt: new Date() };
    this.byUser.set(userId, [...(this.byUser.get(userId) ?? []), message]);
    return Promise.resolve({ ...message });
  }
}
