import type { PlanView } from '@forge/contracts';
import request from 'supertest';
import { bearer, createApp, signUp, type TestApp } from './e2e-helpers';

describe('Plan order (e2e)', () => {
  let app: TestApp;
  let token: string;

  beforeAll(async () => {
    app = await createApp();
    ({ token } = await signUp(app));
  });

  afterAll(async () => {
    await app.close();
  });

  const complete = (id: string) =>
    request(app.getHttpServer()).post(`/plan/sessions/${id}/complete`).set(bearer(token));
  const statuses = (plan: PlanView) => plan.sessions.map((session) => session.status);

  it('enforces the order on the server, end to end', async () => {
    const fresh = await request(app.getHttpServer()).get('/plan').set(bearer(token)).expect(200);
    expect(statuses(fresh.body as PlanView)).toEqual(['open', 'locked', 'locked']);

    const locked = await complete('forge').expect(409);
    expect(locked.body).toEqual({ code: 'SESSION_LOCKED', message: 'Finish Foundation first.' });

    const first = await complete('foundation').expect(200);
    expect(statuses(first.body as PlanView)).toEqual(['completed', 'open', 'locked']);

    const again = await complete('foundation').expect(200);
    expect((again.body as PlanView).completedCount).toBe(1);

    await complete('build').expect(200);
    const reset = await request(app.getHttpServer())
      .post('/plan/reset')
      .set(bearer(token))
      .expect(200);
    expect(reset.body).toMatchObject({ completedCount: 0, nextSessionId: 'foundation' });

    const reread = await request(app.getHttpServer()).get('/plan').set(bearer(token)).expect(200);
    expect(statuses(reread.body as PlanView)).toEqual(['open', 'locked', 'locked']);
  });

  it('advances once when the same completion is sent twice at the same moment', async () => {
    const { token: other } = await signUp(app);
    const send = () =>
      request(app.getHttpServer()).post('/plan/sessions/foundation/complete').set(bearer(other));
    const [a, b] = await Promise.all([send(), send()]);
    expect([a.status, b.status]).toEqual([200, 200]);
    const plan = await request(app.getHttpServer()).get('/plan').set(bearer(other)).expect(200);
    expect((plan.body as PlanView).completedCount).toBe(1);
  });

  it('answers an unknown session id with 404', async () => {
    const response = await complete('marathon').expect(404);
    expect(response.body).toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });
});
