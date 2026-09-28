import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { APP_CONFIG, type AppConfig } from '../config';
import * as schema from './schema';

export const DB = Symbol('DB');
const SQL_CLIENT = Symbol('SQL_CLIENT');

export type Database = PostgresJsDatabase<typeof schema>;

// Supabase's transaction pooler (port 6543) does not support prepared statements.
export function usesTransactionPooler(databaseUrl: string): boolean {
  return new URL(databaseUrl).port === '6543';
}

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) =>
        postgres(config.DATABASE_URL, { prepare: !usesTransactionPooler(config.DATABASE_URL) }),
    },
    {
      provide: DB,
      inject: [SQL_CLIENT],
      useFactory: (client: postgres.Sql): Database => drizzle({ client, schema }),
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly client: postgres.Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
