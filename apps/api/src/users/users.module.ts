import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { DrizzleUsersRepository } from './users.drizzle';
import { USERS_REPOSITORY } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, { provide: USERS_REPOSITORY, useClass: DrizzleUsersRepository }],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
