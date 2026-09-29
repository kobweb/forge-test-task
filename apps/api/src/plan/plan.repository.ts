export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');

// Plan progress is one number per user (decision A); there are no per-session rows.
export interface PlanRepository {
  getCompletedCount(userId: string): Promise<number>;
  /**
   * Compare-and-set: moves the count from `expected` to `expected + 1` only if it is still
   * `expected`, and returns the count afterwards. A concurrent duplicate cannot advance twice.
   */
  advanceFrom(userId: string, expected: number): Promise<number>;
  reset(userId: string): Promise<void>;
}
