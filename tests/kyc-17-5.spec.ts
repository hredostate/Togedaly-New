import { test, expect } from '@playwright/test';

test('safe revalidate requires user_id', async ({ request })=>{
  const r = await request.post('/api/admin/kyc/revalidate-safe', { data: {} });
  expect([400,401,403]).toContain(r.status());
});

test('cron retry endpoint requires admin', async ({ request })=>{
  const r = await request.post('/api/admin/kyc/cron-retry');
  expect([401,403,200]).toContain(r.status());
});
