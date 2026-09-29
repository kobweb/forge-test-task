import type { CoachHistoryResponse, PlanView, SendCoachMessageResponse } from '@forge/contracts';
import request from 'supertest';
import { bearer, createApp, onboard, signUp, type TestApp } from './e2e-helpers';

describe('Isolation and the Plus gate (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets a paying user chat and keeps every user inside their own data', async () => {
    const alex = await signUp(app);
    const sam = await signUp(app);
    await onboard(app, alex.token, 'Alex', ['get_stronger', 'move_daily']);
    await request(app.getHttpServer())
      .post('/plan/sessions/foundation/complete')
      .set(bearer(alex.token))
      .expect(200);

    const purchase = await request(app.getHttpServer())
      .post('/billing/mock-purchase')
      .set(bearer(alex.token))
      .send({ productId: 'forge_plus_yearly' })
      .expect(200);
    expect(purchase.body).toMatchObject({ tier: 'plus', productId: 'forge_plus_yearly' });

    const sent = await request(app.getHttpServer())
      .post('/coach/messages')
      .set(bearer(alex.token))
      .send({ text: "What's my next session?" })
      .expect(201);
    const { reply } = sent.body as SendCoachMessageResponse;
    expect(reply.text).toContain('Alex');
    expect(reply.text).toContain('getting stronger and moving every day');
    expect(reply.text).toContain('Build is up next');

    const history = await request(app.getHttpServer())
      .get('/coach/messages')
      .set(bearer(alex.token))
      .expect(200);
    expect((history.body as CoachHistoryResponse).messages.map((m) => m.role)).toEqual([
      'user',
      'coach',
    ]);

    const samHistory = await request(app.getHttpServer())
      .get('/coach/messages')
      .set(bearer(sam.token))
      .expect(403);
    expect(samHistory.body).toEqual({
      code: 'PLUS_REQUIRED',
      message: 'Coach is part of Forge Plus.',
    });
    await request(app.getHttpServer())
      .post('/coach/messages')
      .set(bearer(sam.token))
      .send({ text: 'Hi' })
      .expect(403);

    const samPlan = await request(app.getHttpServer())
      .get('/plan')
      .set(bearer(sam.token))
      .expect(200);
    expect((samPlan.body as PlanView).completedCount).toBe(0);
    const samEntitlement = await request(app.getHttpServer())
      .get('/billing/entitlement')
      .set(bearer(sam.token))
      .expect(200);
    expect(samEntitlement.body).toEqual({ tier: 'free', productId: null, trialEndsAt: null });
  });

  it('restores nothing for a free account and the purchase for a paying one', async () => {
    const { token } = await signUp(app);
    const before = await request(app.getHttpServer())
      .post('/billing/mock-restore')
      .set(bearer(token))
      .expect(200);
    expect(before.body).toMatchObject({ tier: 'free' });
    await request(app.getHttpServer())
      .post('/billing/mock-purchase')
      .set(bearer(token))
      .send({ productId: 'forge_plus_monthly' })
      .expect(200);
    const after = await request(app.getHttpServer())
      .post('/billing/mock-restore')
      .set(bearer(token))
      .expect(200);
    expect(after.body).toMatchObject({ tier: 'plus', productId: 'forge_plus_monthly' });
  });

  it('rejects a blank coach message and an unknown product with readable copy', async () => {
    const { token } = await signUp(app);
    const product = await request(app.getHttpServer())
      .post('/billing/mock-purchase')
      .set(bearer(token))
      .send({ productId: 'forge_lifetime' })
      .expect(400);
    expect(product.body).toEqual({ code: 'VALIDATION_FAILED', message: 'Choose a plan.' });

    await request(app.getHttpServer())
      .post('/billing/mock-purchase')
      .set(bearer(token))
      .send({ productId: 'forge_plus_monthly' })
      .expect(200);
    const blank = await request(app.getHttpServer())
      .post('/coach/messages')
      .set(bearer(token))
      .send({ text: '   ' })
      .expect(400);
    expect(blank.body).toEqual({ code: 'VALIDATION_FAILED', message: 'Type a message first.' });
  });
});
