import { GOALS, type AuthResponse, type Goal, type User } from '@forge/contracts';
import request from 'supertest';
import {
  bearer,
  createApp,
  onboard,
  PASSWORD,
  signUp,
  uniqueEmail,
  type TestApp,
} from './e2e-helpers';

describe('Auth and profile (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signs up, logs in and reads a fresh profile', async () => {
    const email = uniqueEmail('alex');
    const signup = await signUp(app, email);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const me = await request(app.getHttpServer())
      .get('/me')
      .set(bearer((login.body as AuthResponse).token))
      .expect(200);
    expect(me.body).toEqual({
      id: signup.user.id,
      email,
      displayName: null,
      goals: [],
      consentAcceptedAt: null,
      onboarded: false,
    });
  });

  it('logs in whatever the email casing and surrounding spaces', async () => {
    const email = uniqueEmail('casing');
    await signUp(app, email);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `  ${email.toUpperCase()} `, password: PASSWORD })
      .expect(200);
  });

  it('onboards: dedupes and orders goals, replaces the set, rejects an empty one', async () => {
    const { token } = await signUp(app);
    const onboarded = await request(app.getHttpServer())
      .patch('/me')
      .set(bearer(token))
      .send({
        displayName: 'Alex',
        goals: ['move_daily', 'get_stronger', 'move_daily'],
        acceptConsent: true,
      })
      .expect(200);
    expect(onboarded.body).toMatchObject({
      goals: ['get_stronger', 'move_daily'],
      onboarded: true,
    });

    const empty = await request(app.getHttpServer())
      .patch('/me')
      .set(bearer(token))
      .send({ goals: [] })
      .expect(400);
    expect(empty.body).toEqual({ code: 'VALIDATION_FAILED', message: 'Pick at least one goal.' });

    const replaced = await request(app.getHttpServer())
      .patch('/me')
      .set(bearer(token))
      .send({ goals: ['build_habit'] })
      .expect(200);
    expect((replaced.body as User).goals).toEqual(['build_habit']);
  });

  it('serialises concurrent goal edits instead of failing', async () => {
    const { token } = await signUp(app);
    await onboard(app, token);
    // Goals-only bodies touch no users column, so nothing but the row lock orders them.
    const sent: Goal[][] = [
      ['build_habit'],
      ['move_daily', 'get_stronger'],
      ['get_stronger'],
      ['build_habit', 'move_daily'],
      ['move_daily'],
      ['get_stronger', 'build_habit', 'move_daily'],
      ['build_habit', 'get_stronger'],
      ['move_daily', 'build_habit', 'move_daily'],
    ];
    const responses = await Promise.all(
      sent.map((goals) =>
        request(app.getHttpServer()).patch('/me').set(bearer(token)).send({ goals }),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual(Array<number>(8).fill(200));

    // Last write wins: the stored set is one of the eight, deduped and in GOALS order.
    const me = await request(app.getHttpServer()).get('/me').set(bearer(token)).expect(200);
    const normalised = sent.map((goals) => GOALS.filter((goal) => goals.includes(goal)));
    expect(normalised).toContainEqual((me.body as User).goals);
  });

  it('ignores fields it does not own, such as email', async () => {
    const { token } = await signUp(app);
    const response = await request(app.getHttpServer())
      .patch('/me')
      .set(bearer(token))
      .send({ email: 'hijack@forge.test' })
      .expect(400);
    expect(response.body).toEqual({ code: 'VALIDATION_FAILED', message: 'Nothing to update.' });
  });

  it('refuses a duplicate email, even when two signups race', async () => {
    const email = uniqueEmail('race');
    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/auth/signup').send({ email, password: PASSWORD }),
      request(app.getHttpServer()).post('/auth/signup').send({ email, password: PASSWORD }),
    ]);
    expect([first.status, second.status].sort()).toEqual([201, 409]);
    const again = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: PASSWORD })
      .expect(409);
    expect(again.body).toEqual({
      code: 'EMAIL_TAKEN',
      message: 'An account with this email already exists.',
    });
  });

  it('rejects a wrong password with the shared error shape', async () => {
    const email = uniqueEmail();
    await signUp(app, email);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong password' })
      .expect(401);
    expect(response.body).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect.',
    });
  });

  it('rejects a missing or garbage token', async () => {
    const missing = await request(app.getHttpServer()).get('/me').expect(401);
    expect(missing.body).toEqual({ code: 'UNAUTHORIZED', message: 'Please sign in again.' });
    await request(app.getHttpServer()).get('/me').set(bearer('garbage')).expect(401);
  });

  it('answers malformed JSON with VALIDATION_FAILED, not a crash', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(response.body).toEqual({
      code: 'VALIDATION_FAILED',
      message: 'The request could not be read.',
    });
  });
});
