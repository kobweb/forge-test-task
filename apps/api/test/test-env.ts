import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_TEST_DATABASE_URL = 'postgres://forge:forge@localhost:5432/forge_test';

// e2e always runs against the separate forge_test database, with no coach latency.
// Works without apps/api/.env; values from it are used when present.
export function applyTestEnv(): void {
  const envFile = join(__dirname, '..', '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  process.env.JWT_SECRET ??= 'e2e-secret-that-is-at-least-32-characters';
  process.env.COACH_LATENCY_MIN_MS = '0';
  process.env.COACH_LATENCY_MAX_MS = '0';
}
