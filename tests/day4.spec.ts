import { test, expect } from '@playwright/test';

test.use({ baseURL: 'https://jsonplaceholder.typicode.com' });

test('GET post - status and body', async ({ request }) => {
  const response = await request.get('/posts/1');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body.id).toBe(1);
  expect(body.userId).toBe(1);
  expect(body).toHaveProperty('title');
});

test('POST - create a post', async ({ request }) => {
  const payload = { title: 'QA Lead', body: 'API testing', userId: 1 };
  const response = await request.post('/posts', { data: payload });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.title).toBe(payload.title);
  expect(body.id).toBeDefined();
});

test('PUT - update a post', async ({ request }) => {
  const response = await request.put('/posts/1', {
    data: { id: 1, title: 'Updated', body: 'changed', userId: 1 },
  });

  expect(response.status()).toBe(200);
  expect((await response.json()).title).toBe('Updated');
});

test('DELETE - remove a post', async ({ request }) => {
  const response = await request.delete('/posts/1');
  expect(response.status()).toBe(200);
});

test('negative - non-existing post returns 404', async ({ request }) => {
  const response = await request.get('/posts/999999');
  expect(response.status()).toBe(404);
});

test('response time under 2 seconds', async ({ request }) => {
  const start = Date.now();
  const response = await request.get('/posts');
  const duration = Date.now() - start;

  expect(response.ok()).toBeTruthy();
  expect(duration).toBeLessThan(2000);
  expect((await response.json()).length).toBe(100);
});