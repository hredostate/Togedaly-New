
import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { Payout, Wallet, Webhook, PayoutEvent, LedgerEntry, NotificationChannel } from '../../../types';
import { getReconData, approveSinglePayout, getPayoutTimeline, getPayoutLedger, approveBulkPayouts, approveBulkAndNotifyPayouts } from '../../../services/adminFinanceService';
import { estimateSmsCost } from '../../../services/notificationService';
import { useToasts } from '../../ToastHost';
import AdminRibbon from './recon/AdminRibbon';
import { SendAfterBadge } from '../../notifications/SendAfterBadge';

function koboToNaira(k:number){ return `₦${Math.round((k||0)/100).toLocaleString()}` }

export default function FinanceRecon(){
  const [rows, setRows] = useState<Payout[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'pending'|'queued'|'paid'|'failed'>('all');
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();

  const [sel, setSel] = useState<Record<string, boolean>>({});
  const selectedIds = React.useMemo(()=> Object.keys(sel).filter(k=> sel[k]).map(Number), [sel]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [target, setTarget] = useState<Payout | null>(null);
  const [timeline, setTimeline] = useState<{ events: PayoutEvent[], recent: Payout[], payout: Payout | undefined } | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [bulkPreview, setBulkPreview] = useState({ total: 0, pending: 0, willQueue: 0 });
  
  const [sendChannels, setSendChannels] = React.useState<any>({ toast:true, sms:true, email:false });
  const [dispatchNow, setDispatchNow] = React.useState(false);
  const [smsEstimate, setSmsEstimate] = React.useState<{unit_ngn:number, recipients:number, total_ngn:number}|null>(null);
  const [bulkActionDone, setBulkActionDone] = React.useState(false);


  const load = useCallback(async () => {
    setLoading(true);
    try {
        const j = await getReconData();
        setRows(j.payouts || []);
        setWallets(j.wallets || []);
        setWebhooks(j.webhooks || []);
    } catch (e: any) {
        addToast({ title: "Error", desc: e.message || "Could not load recon data", emoji: "😥" });
    } finally {
        setLoading(false);
    }
  }, [addToast]);
  
  useEffect(()=>{ load() },[load]);

  const filtered = React.useMemo(()=> (rows||[]).filter((p:any)=>{
    const matchesQ = !q || String(p.id).includes(q) || String(p.wallet_id).includes(q);
    const matchesS = status === 'all' || p.status === status;
    return matchesQ && matchesS
  }),[rows,q,status]);

  function toggleAll(v:boolean){
    const next: Record<string, boolean> = {};
    for(const p of filtered){ if(p.status === 'pending') next[p.id] = v }
    setSel(next);
  }

  function askApprove(p:any){ setTarget(p); setConfirmOpen(true); }

  async function approveSingle(){
    if(!target) return;
    // FIX: target.id is a number, approveSinglePayout expects a number.
    await approveSinglePayout(target.id);
    addToast({ title: 'Success', desc: 'Payout approved.', emoji: '✅' });
    setConfirmOpen(false); setTarget(null); load();
  }

  async function openSlide(p:any){
    setTarget(p); setTimeline(null); setLedger([]);
    const [t, l] = await Promise.all([
      getPayoutTimeline(p.id),
      getPayoutLedger(p.id)
    ]);
    setTimeline(t); setLedger(l || []);
  }

  function openBulkConfirm(){
    if(selectedIds.length === 0) return;
    // FIX: Compare string ID from selectedIds with number ID from payout object
    const pending = selectedIds.filter(id => rows.find(p => p.id === id)?.status === 'pending');
    const willQueue = pending.filter(id => (rows.find(p => p.id === id)?.approvals || 0) >= 1);
    setBulkPreview({ total: selectedIds.length, pending: pending.length, willQueue: willQueue.length });
    setSmsEstimate(null);
    setBulkActionDone(false);
    setConfirmBulk(true);
  }

  async function approveBulk(){
    await approveBulkPayouts(selectedIds);
    addToast({ title: 'Success', desc: 'Payouts approved.', emoji: '✅' });
    setBulkActionDone(true);
    load();
  }
  
  async function refreshEstimate(notifIds: string[]) {
      if (!notifIds.length || !sendChannels.sms) {
          setSmsEstimate(null);
          return;
      }
      try {
          const estimate = await estimateSmsCost(notifIds);
          setSmsEstimate(estimate);
      } catch (e) {
          addToast({ title: 'Estimate Failed', desc: 'Could not calculate SMS cost.', emoji: '⚠️' });
      }
  }


  async function approveBulkAndNotify(){
    const channels: NotificationChannel[] = Object.keys(sendChannels).filter(k => sendChannels[k]) as NotificationChannel[];
    if(channels.length === 0) {
        addToast({ title: 'No Channels Selected', desc: 'Please select at least one notification channel.', emoji: '🤔'});
        return;
    }
    
    // Approve and queue, but don't dispatch yet, and get the notification IDs back.
    const data = await approveBulkAndNotifyPayouts(selectedIds, channels, false);
    
    addToast({ title: 'Approved & Queued', desc: 'Payouts approved and notifications are queued.', emoji: '🚀' });
    
    // Now get the estimate
    if (data.notification_ids?.length > 0 && sendChannels.sms) {
        await refreshEstimate(data.notification_ids);
    }
    
    setBulkActionDone(true);
    load();
  }

  if(loading) return <div>Loading finance dashboard...</div>;

  return (
    <div className="space-y-4">
      <AdminRibbon />
      {/* Controls */}
      <div className="rounded-2xl p-4 bg-white border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <input 
            value={q} 
            onChange={e=> setQ(e.target.value)} 
            placeholder="Search by payout or wallet id" 
            className="border rounded-xl px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent" 
            style={{ backgroundColor: '#ffffff', color: '#111827' }}
          />
          <select value={status} onChange={e=> setStatus(e.target.value as any)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=> toggleAll(true)} className="px-3 py-2 rounded-xl border text-sm">Select pending</button>
          <button onClick={()=> toggleAll(false)} className="px-3 py-2 rounded-xl border text-sm">Clear</button>
          <button onClick={openBulkConfirm} disabled={selectedIds.length===0} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50">Bulk approve...</button>
        </div>
      </div>

      {/* Wallets snapshot */}
      <div className="rounded-2xl p-4 bg-white border shadow-sm">
        <div className="font-semibold mb-2">Wallets Snapshot</div>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          {(wallets||[]).slice(0,8).map((w:any)=> (
            <div key={w.id} className="rounded-xl border p-3">
              <div className="text-gray-500 text-xs">{w.owner_type}</div>
              <div className="font-medium">{w.id}</div>
              <div className="text-gray-600">{koboToNaira(w.balance_kobo)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payouts table */}
      <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-3"><input type="checkbox" onChange={e=> toggleAll(e.currentTarget.checked)} /></th>
              <th className="p-3">Payout</th><th className="p-3">Wallet</th><th className="p-3">Amount</th>
              <th className="p-3">Status</th><th className="p-3">Approvals</th><th className="p-3">Split</th>
              <th className="p-3">Created</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p:any)=> (
              <tr key={p.id} className="align-top border-b">
                <td className="p-3"><input type="checkbox" checked={!!sel[p.id]} disabled={p.status!=='pending'} onChange={e=> setSel({ ...sel, [p.id]: e.currentTarget.checked })} /></td>
                <td className="p-3 font-mono text-xs">{p.id}</td><td className="p-3 font-mono text-xs">{p.wallet_id}</td>
                <td className="p-3">{koboToNaira(p.amount_kobo)}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded-lg border text-xs ${p.status==='queued'?'bg-amber-50': p.status==='paid'?'bg-emerald-50': p.status==='failed'?'bg-rose-50':'bg-slate-50'}`}>{p.status}</span></td>
                <td className="p-3">{p.approvals} / 2 {p.can_queue && <span className="ml-2 text-emerald-700 text-xs">ready</span>}</td>
                <td className="p-3">{p.split_code ? <span className="px-2 py-1 rounded-lg border bg-slate-50 font-mono text-[11px]">{p.split_code}</span> : '—'}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={()=> askApprove(p)} disabled={p.status!=='pending'} className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50">Approve</button>
                    <button onClick={()=> openSlide(p)} className="px-2 py-1 rounded-lg border text-xs">Timeline</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={9} className="p-6 text-center text-gray-500">No payouts.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Confirm Single */}
      {confirmOpen && target && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30">
          <div className="w-[520px] rounded-2xl bg-white border shadow-2xl p-4 space-y-3">
            <div className="font-semibold">Confirm approval</div>
            <div className="text-sm text-gray-600">Payout <span className="font-mono">{target.id}</span> currently has <b>{target.approvals}</b>/2 approvals.</div>
            <div className="text-sm text-gray-600">After your approval, status will {target.approvals??0 >=1? <b>move to QUEUED</b> : <b>remain PENDING (needs 1 more)</b>}.</div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={()=> { setConfirmOpen(false); setTarget(null) }} className="px-3 py-2 rounded-xl border">Cancel</button>
              <button onClick={approveSingle} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk */}
      {confirmBulk && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30">
          <div className="w-[560px] rounded-2xl bg-white border shadow-2xl p-4 space-y-3">
            <div className="font-semibold">Bulk approve payouts</div>
            <div className="text-sm text-gray-600">Selected: <b>{bulkPreview.total}</b>. Pending: <b>{bulkPreview.pending}</b>. Will queue immediately: <b>{bulkPreview.willQueue}</b>.</div>
            <div className="text-xs text-gray-500">Note: Only <b>pending</b> payouts are affected.</div>
            
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">Channels:</span>
                <label className="flex items-center gap-1"><input type="checkbox" checked={sendChannels.toast} onChange={e=> setSendChannels({...sendChannels, toast: e.currentTarget.checked})}/> Toast</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={sendChannels.sms} onChange={e=> setSendChannels({...sendChannels, sms: e.currentTarget.checked})}/> SMS</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={sendChannels.email} onChange={e=> setSendChannels({...sendChannels, email: e.currentTarget.checked})}/> Email</label>
                <label className="flex items-center gap-1 ml-4"><input type="checkbox" checked={dispatchNow} onChange={e=> setDispatchNow(e.currentTarget.checked)} disabled={!bulkActionDone} /> Dispatch now</label>
              </div>
            </div>

            {smsEstimate && (
              <div className="p-2 rounded-lg bg-slate-50 border text-sm text-gray-700">
                SMS estimate: <b>₦{smsEstimate.total_ngn.toLocaleString()}</b> 
                <span className="text-xs"> (₦{smsEstimate.unit_ngn}/msg × {smsEstimate.recipients} recipients)</span>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={()=> setConfirmBulk(false)} className="px-3 py-2 rounded-xl border">
                {bulkActionDone ? 'Done' : 'Cancel'}
              </button>
              <button onClick={approveBulk} className="px-3 py-2 rounded-xl bg-slate-900 text-white" disabled={bulkActionDone}>Approve {selectedIds.length}</button>
              <button onClick={approveBulkAndNotify} className="px-3 py-2 rounded-xl bg-emerald-700 text-white" disabled={bulkActionDone}>Approve & Notify {selectedIds.length}</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide‑over Timeline + Ledger */}
      {target && (timeline || ledger.length>0) && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-end bg-black/30">
          <div className="w-[620px] h-full overflow-auto bg-white border-l rounded-l-2xl shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Payout</div>
                <div className="font-semibold font-mono text-sm">{target.id}</div>
                {timeline?.payout?.deferred_until && <div className="mt-1"><SendAfterBadge ts={timeline.payout.deferred_until} /></div>}
              </div>
              <button onClick={()=> { setTimeline(null); setLedger([]); setTarget(null) }} className="px-2 py-1 rounded-lg border text-xs">Close</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-2xl p-3 border"><div className="text-sm font-semibold mb-2">Recent payouts (wallet)</div><div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(timeline?.recent||[]).map((r:any)=> ({ when: new Date(r.created_at).toLocaleDateString(), naira: Math.round((r.amount_kobo||0)/100) }))}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="when" /><YAxis /><Tooltip formatter={(v:any)=> `₦${Number(v).toLocaleString()}`} /><Line type="monotone" dataKey="naira" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
              </div></div>
              <div className="rounded-2xl border overflow-hidden"><div className="p-2 bg-slate-50 font-semibold text-sm">Events</div><table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="p-2 text-left">When</th><th className="p-2 text-left">Event</th><th className="p-2 text-left">Note</th></tr></thead>
                  <tbody>
                    {(timeline?.events||[]).map((e:any, i:number)=> (<tr key={i}><td className="p-2">{new Date(e.created_at).toLocaleString()}</td><td className="p-2">{e.event}</td><td className="p-2">{e.note||'—'}</td></tr>))}
                    {(!timeline || (timeline?.events||[]).length===0) && <tr><td colSpan={3} className="p-3 text-center text-gray-400">No events</td></tr>}
                  </tbody>
              </table></div>
              <div className="rounded-2xl border overflow-hidden"><div className="p-2 bg-slate-50 font-semibold text-sm">Ledger Trail</div><table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="p-2 text-left">When</th><th className="p-2 text-left">Wallet</th><th className="p-2 text-left">Code</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th><th className="p-2 text-left">Ref</th></tr></thead>
                  <tbody>
                    {ledger.map((l:any)=> {
                      const debit = l.amount_kobo < 0 ? koboToNaira(Math.abs(l.amount_kobo)) : ''; const credit = l.amount_kobo > 0 ? koboToNaira(l.amount_kobo) : '';
                      return (<tr key={l.id}><td className="p-2">{new Date(l.ts).toLocaleString()}</td><td className="p-2 font-mono text-[11px]">{l.wallet_id}</td><td className="p-2">{l.code}</td><td className="p-2 text-right text-rose-700">{debit}</td><td className="p-2 text-right text-emerald-700">{credit}</td><td className="p-2 font-mono text-[11px]">{l.ref}</td></tr>)
                    })}
                    {ledger.length===0 && <tr><td colSpan={6} className="p-3 text-center text-gray-400">No related ledger entries</td></tr>}
                  </tbody>
              </table></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}