import { randomUUID } from 'node:crypto';
import type { AuthResponse, User } from '@forge/contracts';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

export type TestApp = INestApplication<App>;

export async function createApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  // Listen once, on loopback, and supertest reuses that server. Left to itself it binds a fresh
  // wildcard port per request, and on macOS another app's 127.0.0.1:<same port> listener then gets
  // the request: a stray 404 (about 1 request in 4,000 here, answered by an editor's local server).
  await app.listen(0, '127.0.0.1');
  return app;
}

// Unique per call, so tests never collide and the test database never needs truncating.
export function uniqueEmail(label = 'user'): string {
  return `${label}-${randomUUID()}@forge.test`;
}

export const PASSWORD = 'correct horse battery';

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function signUp(app: TestApp, email = uniqueEmail()): Promise<AuthResponse> {
  const response = await request(app.getHttpServer())
    .post('/auth/signup')
    .send({ email, password: PASSWORD })
    .expect(201);
  return response.body as AuthResponse;
}

export async function onboard(
  app: TestApp,
  token: string,
  displayName = 'Alex',
  goals = ['get_stronger', 'move_daily'],
): Promise<User> {
  const response = await request(app.getHttpServer())
    .patch('/me')
    .set(bearer(token))
    .send({ displayName, goals, acceptConsent: true })
    .expect(200);
  return response.body as User;
}
