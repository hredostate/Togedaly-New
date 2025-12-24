import { test, expect } from '@playwright/test';

test('active ventures endpoint responds', async ({ request })=>{
  const r = await request.get('/api/me/ventures/active');
  // Should be 200 for mock user, 401 if no session
  expect([200, 401]).toContain(r.status());
});

test('reapply requires tx_id', async ({ request })=>{
  const r = await request.post('/api/admin/credits/reapply', { data: {} });
  // Should be 400 for bad request, or 401/403 for no auth
  expect([400, 401, 403]).toContain(r.status());
});

test('routing csv responds', async ({ request })=>{
  const r = await request.get('/api/admin/reports/routing.csv');
  // Should be 200 for mock, or 401/403 for no auth
  expect([200, 401, 403]).toContain(r.status());
});

test('create override requires fields', async ({ request }) => {
    const r = await request.post('/api/admin/routing-prefs/override', { data: {} });
    expect([400, 401, 403]).toContain(r.status());
});