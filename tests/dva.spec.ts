import { test, expect } from '@playwright/test';

test('providers endpoint responds', async ({ request })=>{
  const r = await request.get('/api/dva/providers');
  expect([200,400]).toContain(r.status());
});

test('create dva requires auth & provider_slug', async ({ request })=>{
  const r = await request.post('/api/dva/create', { data: {} });
  expect([400,401,403]).toContain(r.status());
});
