import type { PlanRepository } from '../../src/plan/plan.repository';

export class InMemoryPlanRepository implements PlanRepository {
  private readonly counts = new Map<string, number>();

  getCompletedCount(userId: string): Promise<number> {
    return Promise.resolve(this.counts.get(userId) ?? 0);
  }

  advanceFrom(userId: string, expected: number): Promise<number> {
    if ((this.counts.get(userId) ?? 0) === expected) this.counts.set(userId, expected + 1);
    return this.getCompletedCount(userId);
  }

  reset(userId: string): Promise<void> {
    this.counts.set(userId, 0);
    return Promise.resolve();
  }
}
