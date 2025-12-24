
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In a real app, this would use the service role key for security
const sba = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest){
  try {
    const { userId, type = 'trust_up', payload = {} } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await sba.from('ai_nudge_queue').insert({ user_id: userId, type, payload });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
