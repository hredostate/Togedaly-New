// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase as sb } from '../../../../supabaseClient';

// This is a placeholder for a Next.js environment.
// It exposes functions that can be called, but won't be a live endpoint in this setup.

export async function GET(req:NextRequest){
  // Verify token handshake
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('hub.verify_token') === process.env.WHATSAPP_CLOUD_VERIFY_TOKEN) {
    return new NextResponse(url.searchParams.get('hub.challenge') || '', { status:200 });
  }
  return new NextResponse('forbidden', { status:403 });
}

export async function POST(req:NextRequest){
  const body = await req.json();
  // Parse statuses → find providerMsgId and update outbound_messages
  const entries = body?.entry || [];
  for (const e of entries){
    const statuses = e?.changes?.[0]?.value?.statuses || [];
    for (const s of statuses){
      const msgId = s.id; const st = s.status; // sent, delivered, read, failed
      const map: any = { sent:'sent', delivered:'delivered', read:'read', failed:'failed' };
      if (map[st]) {
        await sb.from('outbound_messages').update({ 
            status: map[st], 
            updated_at: new Date().toISOString(), 
            delivered_at: (st==='delivered'? new Date().toISOString(): undefined), 
            read_at: (st==='read'? new Date().toISOString(): undefined) 
        }).eq('provider_msg_id', msgId);
      }
    }
  }
  return NextResponse.json({ ok:true });
}
