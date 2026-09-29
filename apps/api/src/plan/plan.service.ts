import type { PlanView, SessionStatus } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { PLAN_REPOSITORY, type PlanRepository } from './plan.repository';
import { PLAN_TEMPLATE } from './plan.template';

@Injectable()
export class PlanService {
  constructor(@Inject(PLAN_REPOSITORY) private readonly progress: PlanRepository) {}

  async getPlan(userId: string): Promise<PlanView> {
    return buildPlanView(await this.progress.getCompletedCount(userId));
  }

  // Server-enforced order: only the open session (index == count) can be completed.
  async complete(userId: string, sessionId: string): Promise<PlanView> {
    const index = PLAN_TEMPLATE.findIndex((session) => session.id === sessionId);
    if (index === -1) throw new AppError('SESSION_NOT_FOUND', 'That session does not exist.');
    const count = await this.progress.getCompletedCount(userId);
    if (index < count) return buildPlanView(count);
    if (index > count) {
      throw new AppError('SESSION_LOCKED', `Finish ${PLAN_TEMPLATE[count].title} first.`);
    }
    return buildPlanView(await this.progress.advanceFrom(userId, index));
  }

  async reset(userId: string): Promise<PlanView> {
    await this.progress.reset(userId);
    return buildPlanView(0);
  }
}

// Decision A: index < count → completed, == count → open, > count → locked.
export function buildPlanView(completedCount: number): PlanView {
  const statusAt = (index: number): SessionStatus =>
    index < completedCount ? 'completed' : index === completedCount ? 'open' : 'locked';
  return {
    sessions: PLAN_TEMPLATE.map((session, index) => ({
      id: session.id,
      number: index + 1,
      title: session.title,
      subtitle: session.subtitle,
      durationMinutes: session.durationMinutes,
      blocks: session.blocks.map((block) => ({ ...block })),
      status: statusAt(index),
    })),
    completedCount,
    totalCount: PLAN_TEMPLATE.length,
    nextSessionId: PLAN_TEMPLATE[completedCount]?.id ?? null,
  };
}
