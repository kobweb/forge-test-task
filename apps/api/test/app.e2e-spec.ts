import request from 'supertest';
import { createApp, type TestApp } from './e2e-helpers';

describe('App (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers an unknown route with the JSON error shape', async () => {
    const response = await request(app.getHttpServer()).get('/nope').expect(404);
    expect(response.body).toEqual({ code: 'NOT_FOUND', message: 'Not found.' });
  });
});
