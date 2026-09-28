import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { applyTestEnv } from './test-env';

// Syncs the Drizzle schema into forge_test once per `pnpm test:e2e` run.
export default function globalSetup(): void {
  applyTestEnv();
  execSync('pnpm exec drizzle-kit push --force', {
    cwd: join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
