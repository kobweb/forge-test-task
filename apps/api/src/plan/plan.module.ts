import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { DrizzlePlanRepository } from './plan.drizzle';
import { PLAN_REPOSITORY } from './plan.repository';
import { PlanService } from './plan.service';

@Module({
  controllers: [PlanController],
  providers: [PlanService, { provide: PLAN_REPOSITORY, useClass: DrizzlePlanRepository }],
  exports: [PlanService],
})
export class PlanModule {}
