// jobs/notify.worker.ts
import { supabase as sb } from '../supabaseClient';
import { deliver } from '../services/notify/router';

function inQuietHours(pref:any){
  try {
    const tz = pref?.quiet_hours?.tz || 'Africa/Lagos';
    const [sH,sM] = String(pref.quiet_hours.start||'21:00').split(':').map(Number);
    const [eH,eM] = String(pref.quiet_hours.end||'07:00').split(':').map(Number);
    const now = new Date();
    // This is a simplified check for a single timezone.
    const hour = now.getHours(), min = now.getMinutes();
    const afterStart = hour > sH || (hour === sH && min >= sM);
    const beforeEnd  = hour < eH || (hour === eH && min <= eM);
    // Assumes overnight window, e.g., 21:00 - 07:00
    if (sH > eH) return afterStart || beforeEnd;
    // Assumes same-day window
    return afterStart && beforeEnd;
  } catch { return false; }
}

export async function runNotifyQueue(limit=50){
  const { data: rows, error: selectError } = await sb.from('outbound_messages').select('*').eq('status','queued').order('created_at', { ascending:true }).limit(limit);
  if (selectError) {
    console.error("Error fetching notify queue:", selectError);
    return;
  }

  for (const r of rows||[]){
    const { data: pref } = await sb.from('channel_prefs').select('*').eq('user_id', r.user_id).single();
    if (pref && inQuietHours(pref)) { continue; } // defer quietly

    await sb.from('outbound_messages').update({ status:'sending', attempts: (r.attempts||0)+1, updated_at: new Date().toISOString() }).eq('id', r.id);
    const res = await deliver({ userId: r.user_id, channel: r.channel as any, templateKey: r.template_key, context: r.payload });
    await sb.from('outbound_messages').update({ status: res.ok? 'sent':'failed', provider: res.provider, provider_msg_id: res.providerMsgId||null, error: res.error||null, updated_at: new Date().toISOString() }).eq('id', r.id);
  }
}
