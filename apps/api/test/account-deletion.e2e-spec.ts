import { eq } from 'drizzle-orm';
import request from 'supertest';
import { DB, type Database } from '../src/db/db.module';
import { coachMessages, entitlements, userGoals, users } from '../src/db/schema';
import {
  bearer,
  createApp,
  onboard,
  PASSWORD,
  signUp,
  uniqueEmail,
  type TestApp,
} from './e2e-helpers';

describe('Account deletion (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('deletes the account and everything it owns', async () => {
    const email = uniqueEmail('leaver');
    const { token, user } = await signUp(app, email);
    await onboard(app, token);
    await request(app.getHttpServer())
      .post('/billing/mock-purchase')
      .set(bearer(token))
      .send({ productId: 'forge_plus_monthly' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/coach/messages')
      .set(bearer(token))
      .send({ text: 'Hi coach' })
      .expect(201);

    await request(app.getHttpServer()).delete('/me').set(bearer(token)).expect(204);

    await request(app.getHttpServer()).get('/me').set(bearer(token)).expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(401);

    const db = app.get<Database>(DB);
    const leftovers = await Promise.all([
      db.select().from(users).where(eq(users.id, user.id)),
      db.select().from(userGoals).where(eq(userGoals.userId, user.id)),
      db.select().from(coachMessages).where(eq(coachMessages.userId, user.id)),
      db.select().from(entitlements).where(eq(entitlements.userId, user.id)),
    ]);
    expect(leftovers.map((rows) => rows.length)).toEqual([0, 0, 0, 0]);
  });
});
