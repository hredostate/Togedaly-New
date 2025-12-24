
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In a real app, this would use the service role key for security
const sbp = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest){
  const userId = req.headers.get('x-user-id')!; // In a real app, get this from auth session
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await sbp.from('ai_nudge_prefs').select('*').eq('user_id', userId).maybeSingle();
  return NextResponse.json(data || {});
}
export async function POST(req: NextRequest){
  const userId = req.headers.get('x-user-id')!; // In a real app, get this from auth session
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await req.json();
  // Basic validation/sanitization would go here
  const { data, error } = await sbp.from('ai_nudge_prefs').upsert({ user_id: userId, ...body, updated_at: new Date().toISOString() }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
