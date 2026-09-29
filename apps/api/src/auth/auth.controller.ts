import {
  loginBodySchema,
  routes,
  signupBodySchema,
  type AuthResponse,
  type LoginBody,
  type SignupBody,
} from '@forge/contracts';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post(routes.auth.signup)
  signup(@Body(new ZodValidationPipe(signupBodySchema)) body: SignupBody): Promise<AuthResponse> {
    return this.auth.signup(body);
  }

  @Public()
  @Post(routes.auth.login)
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody): Promise<AuthResponse> {
    return this.auth.login(body);
  }
}
