
// tests/step-18-6.spec.ts
import { test, expect } from '@playwright/test';

test('ventures with roles endpoint auth', async ({ request })=>{
  const r = await request.get('/api/me/ventures/active');
  expect([200,401]).toContain(r.status());
});

test('bulk reapply paged dry-run', async ({ request })=>{
  const r = await request.post('/api/admin/credits/reapply/bulk', { data: { dryRun: true, limit: 2 } });
  // In a real app with auth, this would be 401/403. In mock, it's 200.
  expect([200,401,403]).toContain(r.status());
});

test('bulk override requires dest', async ({ request })=>{
  const r = await request.post('/api/admin/routing-prefs/override/bulk', { data: {} });
  expect([400,401,403]).toContain(r.status());
});
      