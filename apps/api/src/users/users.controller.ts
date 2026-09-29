import { routes, updateMeBodySchema, type UpdateMeBody, type User } from '@forge/contracts';
import { Body, Controller, Delete, Get, HttpCode, Patch } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(routes.me)
  getMe(@CurrentUserId() userId: string): Promise<User> {
    return this.users.getMe(userId);
  }

  @Patch(routes.me)
  updateMe(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateMeBodySchema)) body: UpdateMeBody,
  ): Promise<User> {
    return this.users.updateMe(userId, body);
  }

  @Delete(routes.me)
  @HttpCode(204)
  async deleteMe(@CurrentUserId() userId: string): Promise<void> {
    await this.users.deleteMe(userId);
  }
}
