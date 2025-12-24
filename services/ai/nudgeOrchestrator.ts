// services/ai/nudgeOrchestrator.ts
import { AIClient } from './client';
import { NaijaSarcasticPersona } from './persona';
import { Prompts } from './prompts';
import { createClient } from '@supabase/supabase-js';
import { enqueue as enqueueForChannels } from '../notify/outbox';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type NudgeRow = { id:number; org_id:number|null; pool_id:number|null; user_id:string; type: string; payload:any; priority:number; };

function withinQuietHours(pref:any, nowLagos: Date){
  try{
    const tz = pref?.quiet_hours?.tz || 'Africa/Lagos';
    const start = pref?.quiet_hours?.start || '22:00';
    const end = pref?.quiet_hours?.end || '06:00';
    // naive check in local time (server is UTC). A more robust approach: luxon.
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour:'2-digit', hour12:false }).format(nowLagos));
    const s = Number(start.split(':')[0]);
    const e = Number(end.split(':')[0]);
    if (s < e) return hour >= s && hour < e; // same-day window
    return hour >= s || hour < e;            // crosses midnight
  }catch{ return false; }
}

function choosePrompt(type:string, ctx:any){
  switch(type){
    case 'trust_up': return Prompts.trustUp(ctx);
    case 'trust_down': return Prompts.trustDown(ctx);
    case 'peer_comment': return Prompts.peerComment(ctx);
    case 'unlock_eligible': return Prompts.unlockEligible(ctx);
    case 'refi_eligible': return Prompts.refiEligible(ctx);
    case 'deal_opportunity': return Prompts.dealOpportunity(ctx);
    case 'chat_momentum': return Prompts.chatMomentum(ctx);
    default: return `Context: ${JSON.stringify(ctx)}\nGoal: Helpful finance nudge. Output JSON {title, body, ctas}`;
  }
}

async function postInApp(userId:string, title:string, body:string, ctas:any[]){
  // Insert as system bot into chat (optional thread per user)
  const botKey = 'trustpool_ai';
  // In a real app, you would fetch bot details. Here we assume it exists.
  // const { data: bot } = await sb.from('chat_bots').select('*').eq('key', botKey).single();
  const threadTitle = `AI • ${title}`;
  // Create or reuse a 1:1 thread between bot and user
  // This logic assumes a `is_direct` and `participants` column which are not in the current chat_threads schema.
  // We will simplify to just creating a new thread for demonstration.
  let { data: thread } = await sb
    .from('chat_threads')
    .select('id')
    .eq('created_by', botKey)
    .like('title', `%${userId}%`) // Simple way to find a bot thread for a user
    .limit(1)
    .single();

  if (!thread) {
    const { data: newThread, error } = await sb.from('chat_threads').insert({ title: `AI Coach for ${userId}`, created_by: botKey, org_id: 1, scope: 'dm' }).select('id').single();
    if (error) throw error;
    await sb.from('chat_participants').insert([{ thread_id: newThread.id, user_id: userId }, { thread_id: newThread.id, user_id: botKey }]);
    thread = newThread;
  }
  if (!thread) throw new Error("Could not create or find a thread for the AI bot.");
  
  await sb.from('chat_messages').insert({ thread_id: thread.id, author: botKey, org_id: 1, body: body, meta: { title, ctas } });
}

async function bumpCounter(key:string, limit=6){
  const now = new Date();
  const { data } = await sb.from('ai_nudge_counters').select('*').eq('key', key).maybeSingle();
  if (!data){
    await sb.from('ai_nudge_counters').insert({ key, count:1, window_end: new Date(now.getTime()+ 24*3600*1000).toISOString() });
    return true;
  } else {
    if (new Date(data.window_end) < now){
      await sb.from('ai_nudge_counters').update({ count:1, window_end: new Date(now.getTime()+ 24*3600*1000).toISOString() }).eq('key', key);
      return true;
    }
    if (data.count + 1 > limit) return false;
    await sb.from('ai_nudge_counters').update({ count: data.count + 1 }).eq('key', key);
    return true;
  }
}

export async function processQueue(batch=25){
  // Atomically grab a batch
  const { data: rows } = await sb.rpc('claim_ai_nudges', { p_batch: batch });
  if (!rows || rows.length === 0) return { processed: 0 };

  const ai = new AIClient('gemini');

  for (const r of rows as NudgeRow[]){
    try{
      const { data: pref } = await sb.from('ai_nudge_prefs').select('*').eq('user_id', r.user_id).maybeSingle();
      if (pref && (pref.enabled === false)) { await sb.from('ai_nudge_queue').update({ status:'skipped', processed_at: new Date().toISOString() }).eq('id', r.id); continue; }
      if (withinQuietHours(pref, new Date())) { await sb.from('ai_nudge_queue').update({ status:'skipped', error:'quiet_hours', processed_at: new Date().toISOString() }).eq('id', r.id); continue; }
      
      const { data: channelPref } = await sb.from('channel_prefs').select('primary_channel').eq('user_id', r.user_id).single();
      const key = `nudge:${r.user_id}:${new Date().toISOString().slice(0,10)}`;
      const ok = await bumpCounter(key, 6);
      if (!ok){ await sb.from('ai_nudge_queue').update({ status:'skipped', error:'rate_limited', processed_at: new Date().toISOString() }).eq('id', r.id); continue; }

      const system = `${NaijaSarcasticPersona}\nSarcasm level: ${pref?.sarcasm_level ?? 3}`;
      const prompt = choosePrompt(r.type, r.payload);
      const raw = await ai.generate({ system, prompt, json: true });
      let parsed: any; try { parsed = JSON.parse(raw); } catch { parsed = { title: 'Heads up', body: raw, ctas: [] }; }

      // 1. Deliver in-app toast/chat message
      await postInApp(r.user_id, parsed.title, parsed.body, parsed.ctas || []);
      
      // 2. Enqueue for omni-channel delivery
      await enqueueForChannels(r.user_id, channelPref?.primary_channel || 'inapp', r.type, { ...r.payload, ...parsed });

      await sb.from('ai_nudge_queue').update({ status:'sent', processed_at: new Date().toISOString() }).eq('id', r.id);
    } catch (e:any){
      await sb.from('ai_nudge_queue').update({ status:'error', error: String(e), processed_at: new Date().toISOString() }).eq('id', r.id);
    }
  }
  return { processed: rows.length };
}