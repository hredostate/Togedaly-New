import { test, expect } from '@playwright/test';

test('banks endpoint may 503 in API‑only mode', async ({ request })=>{
  const r = await request.get('/api/banks');
  expect([200,503]).toContain(r.status());
});

test('admin revalidate requires user_id', async ({ request })=>{
  const r = await request.post('/api/admin/kyc/revalidate', { data: {} });
  expect([400,401,403]).toContain(r.status());
});
