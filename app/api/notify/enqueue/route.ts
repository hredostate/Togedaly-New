// app/api/notify/enqueue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase as sb } from '../../../../supabaseClient';

// This is a placeholder for a Next.js environment.
export async function POST(req:NextRequest){
  try {
    const body = await req.json();
    const { userId, channel, templateKey, payload } = body;
    if (!userId || !channel || !templateKey) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    await sb.from('outbound_messages').insert({ user_id:userId, channel, template_key:templateKey, payload, status:'queued', provider:'pending' });
    return NextResponse.json({ ok:true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
