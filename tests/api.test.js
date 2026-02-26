// Ensure we are using the mock DB before anything else
process.env.USE_MOCK_DB = 'true';

const request = require('supertest');
const app = require('../src/app');

describe('API Endpoints', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  test('GET / should return app info', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Shopify Attribution & Order Inspector');
  });
});
