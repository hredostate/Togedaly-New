


import React, { useEffect, useMemo, useState } from 'react';
import type { Page } from '../App';
import type { AjoBoardEntry, AjoMemberDetails, AjoHistoryPoint } from '../types';
import { getAjoGroupDetails, remindAjoMember, getAjoMemberTimeline } from '../services/analyticsService';
import { TrendChart } from '../components/ui/TrendChart';
import { useToasts } from '../components/ToastHost';

function pct(x: number){ return `${Math.round(Number(x||0)*100)}%` }


// ===== Hover Prefetch Cache & Wrapper =====
const AJO_CACHE: Map<string, any> =
  (globalThis as any).__ajoCache || ((globalThis as any).__ajoCache = new Map());

async function prefetchMemberCtx(groupId: string, userId: string) {
  const key = `${groupId}:${userId}`;
  if (AJO_CACHE.has(key)) return AJO_CACHE.get(key);
  try {
    // Adapted from user's `fetch` to use mock service
    const timeline = await getAjoMemberTimeline(groupId, userId);
    const j = { timeline };
    AJO_CACHE.set(key, j);
    return j;
  } catch {
    return null;
  }
}

// ======================= ReminderComposer Component ========================
const ReminderComposer: React.FC<{ groupId: string, userId: string, data: any, onSent?: () => void }> = ({ groupId, userId, data, onSent }) => {
  const [tone, setTone] = useState<'naija'|'formal'|'strict'>('naija');
  const [channel, setChannel] = useState<'sms'|'whatsapp'|'email'>('sms');
  const [body, setBody] = useState<string>('');
  const [dirty, setDirty] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const { add: addToast } = useToasts();
  const limit = channel==='email' ? 2000 : (channel==='whatsapp' ? 1000 : 160);
  
  const [ctx, setCtx] = useState<any>(data || {});
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    let cancelled = false;
    async function load() {
      const key = `${groupId}:${userId}`;
      if (ctx?.timeline && ctx.timeline.length > 0) return;
      const cached = AJO_CACHE.get(key);
      if (cached) { setCtx((prev:any)=> ({ ...prev, ...cached })); return; }
      setLoading(true);
      try {
        const j = await prefetchMemberCtx(groupId, userId);
        if (!cancelled && j) setCtx((prev:any)=> ({ ...prev, ...j }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return ()=> { cancelled = true };
  }, [groupId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const composeDefault = (t: typeof tone, d:any) => {
    const title = d?.board?.title || 'Ajo';
    const name = d?.member?.member_name || 'Member';
    const nextDueEntry = d?.timeline?.find((x: any) => x.status === 'due');
    const nextDue = nextDueEntry ? `due ${new Date(nextDueEntry.due_date).toLocaleDateString()}` : 'due soon';
    const lateCount = d?.timeline?.filter((x: any) => x.status === 'late').length || 0;

    if(t==='naija') return `Hi ${name}, small reminder: ${title} payment ${nextDue}. No carry last. ${(lateCount>0)?`You missed ${lateCount} before—make we balance am.`:''}`.trim();
    if(t==='strict') return `Reminder: ${title} payment ${nextDue}. Please settle immediately to maintain standing.`;
    return `Dear ${name}, this is a friendly reminder that your ${title} payment is ${nextDue}. Thank you.`;
  };

  useEffect(() => {
    if(!dirty){ setBody(composeDefault(tone, ctx)) }
  },[tone, ctx, dirty]);

  async function send() {
    setSending(true);
    try {
      await remindAjoMember(groupId, userId, channel as any, body, tone);
      addToast({ title: 'Reminder Queued', desc: `Message sent via ${channel}.`, emoji: '✅'});
      if (onSent) onSent();
    } catch(e) {
      addToast({title: 'Failed to queue reminder', desc: 'An error occurred.', emoji: 'error'});
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full md:items-end p-2 border-t mt-2">
      <div className="flex-1">
        <label className="text-xs text-gray-500">Tone</label>
        <div className="flex gap-2 mt-1">
          {(['naija','formal','strict'] as const).map(t=> (
            <button key={t} onClick={()=> { setDirty(false); setTone(t); }} className={`px-3 py-2 rounded-xl border text-sm ${tone===t? 'bg-slate-900 text-white':''}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-500">Message</label>
        <textarea value={body} onChange={e=> { setDirty(true); setBody(e.target.value) }} rows={3} className="w-full border rounded-xl px-3 py-2 text-sm mt-1" />
        <div className={`text-xs mt-1 ${body.length>limit? 'text-rose-600':'text-gray-500'}`}>{body.length}/{limit}</div>
      </div>
      <div>
        <button disabled={sending || body.length===0 || body.length>limit} onClick={send} className="px-3 py-2 rounded-xl bg-brand text-white disabled:opacity-50">{sending? 'Sending…' : 'Queue Reminder'}</button>
      </div>
    </div>
  );
};


function RemindRowAction(
  { groupId, userId, board, member }:
  { groupId:string, userId:string, board:any, member:any }
){
  const [open, setOpen] = React.useState(false);

  async function onHover(){ await prefetchMemberCtx(groupId, userId) }

  // Listen for global inline open from the popover
  React.useEffect(()=>{
    function onOpen(e: any){
      const d = e?.detail||{};
      if(d.groupId===groupId && d.userId===userId){ setOpen(true) }
    }
    window.addEventListener('open-composer', onOpen);
    return ()=> window.removeEventListener('open-composer', onOpen);
  },[groupId,userId]);

  return (
    <div onMouseEnter={onHover} className="flex items-start">
      {!open && (
        <button
          data-remind={`${groupId}:${userId}`}
          onClick={()=> setOpen(true)}
          className="px-2 py-1 rounded-lg border text-xs"
        >
          Remind
        </button>
      )}
      {open && (
        <div className="w-full max-w-xl">
          <ReminderComposer
            groupId={groupId}
            userId={userId}
            data={{ board, member, ...(AJO_CACHE.get(`${groupId}:${userId}`)||{}) }}
            onSent={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

const BulkReminder: React.FC<{ groupId:string, items:AjoMemberDetails[], onDone:()=>void }> = ({ groupId, items, onDone }) => {
  const [tone, setTone] = useState<'naija'|'formal'|'strict'>('naija');
  const [channel, setChannel] = useState<'sms'|'whatsapp'|'email'>('sms');
  const [sending, setSending] = useState(false);
  const { add: addToast } = useToasts();

  async function send(){
    setSending(true);
    let successCount = 0;
    for(const it of items){
      try {
        await remindAjoMember(groupId, it.user_id, channel as any, '', tone);
        successCount++;
      } catch {
        // continue
      }
    }
    setSending(false); 
    onDone(); 
    addToast({ title: 'Bulk Send Complete', desc: `${successCount}/${items.length} reminders queued.`, emoji: '🚀'});
  }

  return (
    <div className="flex items-center gap-2">
      <select value={tone} onChange={e=> setTone(e.target.value as any)} className="border rounded-xl px-2 py-1 text-sm bg-white"><option>naija</option><option>formal</option><option>strict</option></select>
      <select value={channel} onChange={e=> setChannel(e.target.value as any)} className="border rounded-xl px-2 py-1 text-sm bg-white"><option>sms</option><option>whatsapp</option><option>email</option></select>
      <button disabled={!items.length || sending} onClick={send} className="px-3 py-2 rounded-xl border disabled:opacity-50">Send {items.length} reminders</button>
    </div>
  )
};

const AjoGroupDetail: React.FC<{ group: Partial<AjoBoardEntry> & { group_id: string }; setPage: (page: Page, context?: any) => void }> = ({ group, setPage }) => {
  const [data, setData] = useState<{ board: AjoBoardEntry; members: AjoMemberDetails[]; history: AjoHistoryPoint[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'late'|'ok'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { add: addToast } = useToasts();
  
  useEffect(() => {
    setLoading(true);
    getAjoGroupDetails(group.group_id)
        .then(setData)
        .catch(() => addToast({ title: 'Error', desc: 'Could not load group details.', emoji: '😥' }))
        .finally(() => setLoading(false));
  }, [group.group_id, addToast]);

  const members = useMemo(() => {
    const rows = data?.members || [];
    if(filter === 'late') return rows.filter((r) => (r.periods_missed || 0) > 0);
    if(filter === 'ok') return rows.filter((r) => (r.periods_missed || 0) === 0);
    return rows;
  }, [data, filter]);

  const allChecked = useMemo(() => members.length > 0 && members.every(r => selected[r.user_id]), [members, selected]);
  const toggleAll = () => {
      const newSelected: Record<string, boolean> = {};
      if (!allChecked) {
          members.forEach(r => newSelected[r.user_id] = true);
      }
      setSelected(newSelected);
  };
  const toggleOne = (userId: string) => {
      setSelected(prev => ({ ...prev, [userId]: !prev[userId] }));
  };
  const selectedItems = useMemo(() => members.filter(r => selected[r.user_id]), [members, selected]);

  // Mock chart data based on members
  const paymentChartData = useMemo(() => {
      if (!members.length) return [];
      // Mock trend data derived from members current state
      return members.map((m, i) => ({
          name: m.member_name.split(' ')[0],
          paid: m.paid_kobo / 100
      })).slice(0, 10);
  }, [members]);

  const lateVsPaidData = useMemo(() => {
      const paid = members.reduce((sum, m) => sum + m.periods_paid, 0);
      const missed = members.reduce((sum, m) => sum + m.periods_missed, 0);
      return [
          { name: 'Paid Periods', val: paid },
          { name: 'Missed Periods', val: missed }
      ];
  }, [members]);

  const defaulters = useMemo(() => members.filter(m => (m.periods_missed || 0) > 0), [members]);

  const handleNudgeDefaulters = async () => {
      if (defaulters.length === 0) return;
      // In a real app, this would use a dedicated endpoint. 
      // We simulate sending reminders to all defaulters.
      for (const d of defaulters) {
          await remindAjoMember(group.group_id, d.user_id, 'sms', '', 'strict', 'ajo_late');
      }
      addToast({ title: 'Nudges Sent', desc: `Social pressure applied to ${defaulters.length} defaulters.`, emoji: '😤' });
  };

  if (loading) return <div>Loading group details...</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => setPage('ajoHealth')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Ajo Health Board</button>
      <div className="rounded-2xl p-4 bg-white border">
        <div className="text-sm text-gray-500">Ajo Group</div>
        <div className="text-2xl font-semibold">{data?.board?.title || '—'}</div>
        <div className="text-sm text-gray-600">Members: {data?.board?.members||0} • On‑Time: {pct(data?.board?.on_time_ratio||0)} • Contributed: ₦{(data?.board?.contributed_ngn||0).toLocaleString()}</div>
      </div>
      
      {/* SHAME LIST (Social Pressure) */}
      {defaulters.length > 0 && (
          <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200">
              <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                      <span className="text-xl">⚠️</span> Defaulters Corner
                  </div>
                  <button onClick={handleNudgeDefaulters} className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md">
                      Nudge All
                  </button>
              </div>
              <p className="text-xs text-rose-700 mb-3">These members are currently delaying the cycle. Apply social pressure.</p>
              <div className="flex flex-wrap gap-2">
                  {defaulters.map(d => (
                      <div key={d.user_id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-rose-100 text-sm shadow-sm">
                          <span className="font-semibold text-gray-800">{d.member_name}</span>
                          <span className="text-rose-600 font-medium text-xs bg-rose-50 px-1.5 rounded">{d.periods_missed} missed</span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 bg-white border">
            <div className="font-semibold mb-2">Total Contributions (By Member)</div>
            <TrendChart data={paymentChartData} dataKey="paid" categoryKey="name" type="bar" color="#4F46E5" formatter={(v) => `₦${v.toLocaleString()}`} />
        </div>
        <div className="rounded-2xl p-4 bg-white border">
            <div className="font-semibold mb-2">Paid vs Late Periods</div>
            <TrendChart data={lateVsPaidData} dataKey="val" categoryKey="name" type="bar" color="#EC4899" />
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-white border flex items-center justify-between gap-3">
        <div className="font-semibold">Members</div>
        <div className="flex gap-2 text-sm">
          <button onClick={()=>setFilter('all')} className={`px-3 py-2 rounded-xl border ${filter==='all'?'bg-slate-900 text-white':''}`}>All</button>
          <button onClick={()=>setFilter('late')} className={`px-3 py-2 rounded-xl border ${filter==='late'?'bg-rose-600 text-white':''}`}>Late</button>
          <button onClick={()=>setFilter('ok')} className={`px-3 py-2 rounded-xl border ${filter==='ok'?'bg-emerald-600 text-white':''}`}>OK</button>
        </div>
      </div>
      
      <div className="rounded-2xl p-4 bg-white border flex items-center justify-between">
        <div className="text-sm text-gray-600">Selected: {selectedItems.length}</div>
        <BulkReminder groupId={group.group_id} items={selectedItems} onDone={()=> setSelected({})} />
      </div>

      <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead><tr className="bg-slate-50 text-left border-b"><th className="p-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th><th className="p-3">Member</th><th className="p-3">Paid / Due</th><th className="p-3">Missed</th><th className="p-3">Next Due</th><th className="p-3">Total Paid (₦)</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id} className={`border-b ${(m.periods_missed||0)>0? 'bg-rose-50/50':''}`}>
                <td className="p-3"><input type="checkbox" checked={!!selected[m.user_id]} onChange={() => toggleOne(m.user_id)} /></td>
                <td className="p-3 font-medium">
                   <button onClick={() => setPage('ajoMemberDetail', { member: { ...m, group_id: group.group_id } })} className="text-brand underline hover:text-brand-700">
                    {m.member_name}
                  </button>
                  {(m.periods_missed||0) > 0 && <span className="ml-2 text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">LATE</span>}
                </td>
                <td className="p-3">{m.periods_paid}/{m.periods_due}</td>
                <td className={`p-3 ${(m.periods_missed||0)>0 ? 'text-rose-600 font-bold' : ''}`}>{m.periods_missed}</td>
                <td className="p-3">{m.next_due? new Date(m.next_due).toLocaleDateString(): '—'}</td>
                <td className="p-3">{Math.round((m.paid_kobo||0)/100).toLocaleString()}</td>
                <td className="p-3">
                    <RemindRowAction groupId={group.group_id} userId={m.user_id} board={data!.board} member={m} />
                </td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No members.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AjoGroupDetail;
