import {
  mockPurchaseBodySchema,
  routes,
  type Entitlement,
  type MockPurchaseBody,
} from '@forge/contracts';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get(routes.billing.entitlement)
  get(@CurrentUserId() userId: string): Promise<Entitlement> {
    return this.billing.get(userId);
  }

  @Post(routes.billing.mockPurchase)
  @HttpCode(200)
  purchase(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(mockPurchaseBodySchema)) body: MockPurchaseBody,
  ): Promise<Entitlement> {
    return this.billing.purchase(userId, body.productId);
  }

  @Post(routes.billing.mockRestore)
  @HttpCode(200)
  restore(@CurrentUserId() userId: string): Promise<Entitlement> {
    return this.billing.restore(userId);
  }
}
