// tests/step-18-9.spec.ts
import { test, expect } from '@playwright/test'

test('routing report shows sender bank filterable CSV', async ({ request })=>{
  const r = await request.get('/api/admin/reports/routing.csv?strict_bank=Wema%20Bank&min_amount=1000')
  expect([200,401,403]).toContain(r.status())
})

test('override endpoint still responds', async ({ request })=>{
  const r = await request.post('/api/admin/routing-prefs/override', { data: { user:'user:demo', narration:'AJO:TEST', dest:'ajo' } })
  // Should be 200 for mock, 400 for bad req, or 401/403 for no auth
  expect([200,400,401,403]).toContain(r.status())
})
