// /app/api/coach/events/route.ts  (POST)
import { supabase } from '../../../../supabaseClient'; // Using the existing client
import type { UserEventPayload } from '../../../../types';

// This is a placeholder for a Next.js environment.
// It exposes a function that can be called, but won't be a live endpoint in this setup.
export async function POST(req: { json: () => Promise<UserEventPayload | UserEventPayload[]> }){
  const body = await req.json(); 
  const rows = Array.isArray(body)? body : [body];
  const insert = rows.map(r=>({
    org_id: r.orgId, user_id: r.userId, kind: r.kind,
    pool_id: r.poolId ?? null, groupbuy_id: r.groupbuyId ?? null,
    amount: r.amount ?? null, meta: r.meta ?? {}, ts: r.ts ?? new Date().toISOString()
  }));

  // In a real app, you would use supabaseAdmin here for security.
  console.log('MOCK API: Inserting user events', insert);
  const { error } = await supabase.from('user_event_log').insert(insert);
  
  if (error) return { status: 400, body: JSON.stringify({ error: error.message }) };
  return { status: 200, body: JSON.stringify({ ok: true, count: insert.length }) };
}