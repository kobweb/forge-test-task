import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { DrizzleBillingRepository } from './billing.drizzle';
import { BILLING_REPOSITORY } from './billing.repository';
import { BillingService } from './billing.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, { provide: BILLING_REPOSITORY, useClass: DrizzleBillingRepository }],
  exports: [BillingService],
})
export class BillingModule {}
