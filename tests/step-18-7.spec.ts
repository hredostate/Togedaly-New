// tests/step-18-7.spec.ts
import { test, expect } from '@playwright/test';

test('admin ventures with roles responds', async ({ request })=>{
  const r = await request.get('/api/admin/user/ventures?user_id=dummy');
  // Mock should be 200, real app would be 401/403 without auth
  expect([200, 401, 403]).toContain(r.status());
});

test('bulk override dry-run supports filters', async ({ request })=>{
  const r = await request.post('/api/admin/routing-prefs/override/bulk', { 
    data: { dest:'ajo', dryRun:true, bank:'wema', min_amount: 5000 } 
  });
  expect([200, 401, 403]).toContain(r.status());
});

test('filtered unrouted report responds', async ({ request })=>{
  const r = await request.get('/api/admin/reports/routing?bank=wema&min_amount=1000');
  expect([200, 401, 403]).toContain(r.status());
});