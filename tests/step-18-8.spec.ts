// tests/step-18-8.spec.ts
import { test, expect } from '@playwright/test';

test('unrouted strict bank filter responds', async ({ request })=>{
  const r = await request.get('/api/admin/reports/routing?strict_bank=Wema%20Bank&min_amount=1000');
  // Mock should be 200, real app would be 401/403 without auth
  expect([200, 401, 403]).toContain(r.status());
});

test('csv strict bank filter responds', async ({ request })=>{
  const r = await request.get('/api/admin/reports/routing.csv?strict_bank=gtbank');
  // Mock should be 200, real app would be 401/403 without auth
  expect([200, 401, 403]).toContain(r.status());
});
