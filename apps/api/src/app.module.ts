import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpErrorFilter } from './common/http-error.filter';
import { ConfigModule } from './config.module';
import { DbModule } from './db/db.module';

@Module({
  imports: [ConfigModule, DbModule],
  providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
})
export class AppModule {}
