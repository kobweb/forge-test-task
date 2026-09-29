import {
  routes,
  sendCoachMessageBodySchema,
  type CoachHistoryResponse,
  type SendCoachMessageBody,
  type SendCoachMessageResponse,
} from '@forge/contracts';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CoachService } from './coach.service';

@Controller()
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  @Get(routes.coach.messages)
  async history(@CurrentUserId() userId: string): Promise<CoachHistoryResponse> {
    return { messages: await this.coach.history(userId) };
  }

  @Post(routes.coach.messages)
  send(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(sendCoachMessageBodySchema)) body: SendCoachMessageBody,
  ): Promise<SendCoachMessageResponse> {
    return this.coach.send(userId, body.text);
  }
}
