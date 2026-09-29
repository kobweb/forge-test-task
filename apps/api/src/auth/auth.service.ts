import type { AuthResponse, LoginBody, SignupBody } from '@forge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { AppError } from '../common/app-error';
import { USERS_REPOSITORY, type UserRecord, type UsersRepository } from '../users/users.repository';
import { toUser } from '../users/users.service';

const BCRYPT_COST = 10;
// Compared against when the email is unknown, so a login takes as long whether or not the
// account exists (no user enumeration through timing). Hash of a throwaway string.
const DUMMY_HASH = '$2b$10$rvvMb2uRs47ULOEAFdkg7Ou1FZXUp/yrtZ1x1ciRHOx9kg5WJ/sYO';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async signup(body: SignupBody): Promise<AuthResponse> {
    if (await this.users.findByEmail(body.email)) {
      throw new AppError('EMAIL_TAKEN', 'An account with this email already exists.');
    }
    const passwordHash = await hash(body.password, BCRYPT_COST);
    return this.session(await this.users.create({ email: body.email, passwordHash }));
  }

  async login(body: LoginBody): Promise<AuthResponse> {
    const user = await this.users.findByEmail(body.email);
    const matches = await compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches) {
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    return this.session(user);
  }

  private async session(user: UserRecord): Promise<AuthResponse> {
    return { token: await this.jwt.signAsync({ sub: user.id }), user: toUser(user) };
  }
}
