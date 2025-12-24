// services/notify/outbox.ts
import { supabase as sb } from '../../supabaseClient';
import type { Channel, ProviderResult } from './types';

export async function enqueue(userId:string, channel:Channel, templateKey:string, payload:any){
  const { error } = await sb.from('outbound_messages').insert({ user_id:userId, channel, template_key:templateKey, payload, status:'queued', provider:'pending' });
  if (error) console.error("Failed to enqueue notification:", error);
}

export async function markSending(id:number, provider:string){
  await sb.from('outbound_messages').update({ status:'sending', provider, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function markResult(id:number, r:ProviderResult){
  await sb.from('outbound_messages').update({ status: r.ok? 'sent':'failed', provider: r.provider, provider_msg_id: r.providerMsgId || null, error: r.error || null, updated_at: new Date().toISOString() }).eq('id', id);
}
