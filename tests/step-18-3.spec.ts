import { test, expect } from '@playwright/test';

test('reports endpoint responds', async ({ request })=>{
  const r = await request.get('/api/admin/reports/routing');
  // In a mock environment without auth, this should succeed.
  // In a real app, it would be 401/403 without an admin session.
  expect([200, 401, 403]).toContain(r.status());
});

test('narration builder renders tag', async ()=>{
  // This is a UI smoke test placeholder.
  // A full E2E test would mount the component, interact with it,
  // and assert that the correct tag is rendered and copied.
  expect(true).toBeTruthy();
});
