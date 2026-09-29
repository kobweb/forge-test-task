import type { CoachMessage, PlanView, SendCoachMessageResponse, User } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';
import { AppError } from '../common/app-error';
import { PlanService } from '../plan/plan.service';
import { UsersService } from '../users/users.service';
import { composeCoachReply, type CoachContext } from './coach-reply';
import {
  COACH_REPOSITORY,
  type CoachMessageRecord,
  type CoachRepository,
} from './coach.repository';

export const COACH_DELAY = Symbol('COACH_DELAY');
/** Simulated model latency. Production: 600–1200 ms. Tests: no wait. */
export type CoachDelay = () => Promise<void>;

const HISTORY_LIMIT = 100;

@Injectable()
export class CoachService {
  constructor(
    @Inject(COACH_REPOSITORY) private readonly messages: CoachRepository,
    private readonly users: UsersService,
    private readonly plan: PlanService,
    private readonly billing: BillingService,
    @Inject(COACH_DELAY) private readonly delay: CoachDelay,
  ) {}

  async history(userId: string): Promise<CoachMessage[]> {
    await this.requirePlus(userId);
    const records = await this.messages.listRecent(userId, HISTORY_LIMIT);
    return records.map(toCoachMessage);
  }

  async send(userId: string, text: string): Promise<SendCoachMessageResponse> {
    await this.requirePlus(userId);
    const message = await this.messages.append(userId, 'user', text);
    const [user, plan] = await Promise.all([this.users.getMe(userId), this.plan.getPlan(userId)]);
    const replyText = composeCoachReply(toCoachContext(user, plan), text);
    await this.delay();
    const reply = await this.messages.append(userId, 'coach', replyText);
    return { message: toCoachMessage(message), reply: toCoachMessage(reply) };
  }

  // The paywall is enforced here, not only in the app.
  private async requirePlus(userId: string): Promise<void> {
    const { tier } = await this.billing.get(userId);
    if (tier !== 'plus') throw new AppError('PLUS_REQUIRED', 'Coach is part of Forge Plus.');
  }
}

function toCoachContext(user: User, plan: PlanView): CoachContext {
  const next = plan.sessions.find((session) => session.id === plan.nextSessionId);
  return {
    displayName: user.displayName,
    goals: user.goals,
    completedCount: plan.completedCount,
    totalCount: plan.totalCount,
    next: next
      ? { title: next.title, durationMinutes: next.durationMinutes, blockCount: next.blocks.length }
      : null,
    firstSessionTitle: plan.sessions[0].title,
  };
}

function toCoachMessage(record: CoachMessageRecord): CoachMessage {
  return {
    id: String(record.id),
    role: record.role,
    text: record.text,
    createdAt: record.createdAt.toISOString(),
  };
}
