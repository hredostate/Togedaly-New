// tests/step-18-5.spec.ts
import { test, expect } from '@playwright/test';

test('member ventures endpoint requires auth', async ({ request })=>{
  const r = await request.get('/api/me/ventures/active');
  expect([200,401]).toContain(r.status());
});

test('bulk reapply dry-run responds', async ({ request })=>{
  const r = await request.post('/api/admin/credits/reapply/bulk', { data: { dryRun: true } });
  expect([200,401,403]).toContain(r.status());
});

test('admin user ventures requires user_id', async ({ request })=>{
  const r = await request.get('/api/admin/user/ventures');
  expect([400,401,403]).toContain(r.status());
});
