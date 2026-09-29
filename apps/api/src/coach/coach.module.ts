import { setTimeout as sleep } from 'node:timers/promises';
import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { APP_CONFIG, type AppConfig } from '../config';
import { PlanModule } from '../plan/plan.module';
import { UsersModule } from '../users/users.module';
import { CoachController } from './coach.controller';
import { DrizzleCoachRepository } from './coach.drizzle';
import { COACH_REPOSITORY } from './coach.repository';
import { COACH_DELAY, CoachService, type CoachDelay } from './coach.service';

@Module({
  imports: [UsersModule, PlanModule, BillingModule],
  controllers: [CoachController],
  providers: [
    CoachService,
    { provide: COACH_REPOSITORY, useClass: DrizzleCoachRepository },
    {
      provide: COACH_DELAY,
      inject: [APP_CONFIG],
      useFactory:
        ({ COACH_LATENCY_MIN_MS: min, COACH_LATENCY_MAX_MS: max }: AppConfig): CoachDelay =>
        () =>
          sleep(min + Math.floor(Math.random() * (Math.max(max - min, 0) + 1))),
    },
  ],
})
export class CoachModule {}
