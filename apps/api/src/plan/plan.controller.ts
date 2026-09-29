import { routes, type PlanView } from '@forge/contracts';
import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { PlanService } from './plan.service';

@Controller()
export class PlanController {
  constructor(private readonly plan: PlanService) {}

  @Get(routes.plan.get)
  get(@CurrentUserId() userId: string): Promise<PlanView> {
    return this.plan.getPlan(userId);
  }

  @Post(routes.plan.complete(':id'))
  @HttpCode(200)
  complete(@CurrentUserId() userId: string, @Param('id') sessionId: string): Promise<PlanView> {
    return this.plan.complete(userId, sessionId);
  }

  @Post(routes.plan.reset)
  @HttpCode(200)
  reset(@CurrentUserId() userId: string): Promise<PlanView> {
    return this.plan.reset(userId);
  }
}
