
import React, { useState, useEffect, useCallback } from 'react';
import { getNudges } from '../../../services/analyticsService';
import { useToasts } from '../../ToastHost';

function timeAgo(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function MiniSparkline({ data, width = 120, height = 24 }: { data: { day: string; count: number }[]; width?: number; height?: number }) {
  const w = width, h = height;
  if (!data || data.length === 0) return <svg width={w} height={h} />;
  const max = Math.max(1, ...data.map(d => d.count || 0));
  const step = data.length > 1 ? (w / (data.length - 1)) : w;
  const points = data.map((d, i) => {
    const x = Math.round(i * step);
    const y = Math.round(h - (d.count / max) * h);
    return `${x},${y}`;
  }).join(' ');
  const last = data[data.length - 1]?.count || 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="text-slate-900">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      <text x={w} y={h} textAnchor="end" dominantBaseline="ideographic" fontSize="10">{last}</text>
    </svg>
  );
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const NudgesModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState<string>('');
  const [userId, setUserId] = useState<string|undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const { add: addToast } = useToasts();

  const [fChannel, setFChannel] = useState<string>('');
  const [fCode, setFCode] = useState<string>('');
  const [fFrom, setFFrom] = useState<string>('');
  const [fTo, setFTo] = useState<string>('');
  const [summary, setSummary] = useState<Record<string, number>>({});

  const [running, setRunning] = useState(false);
  const [trend, setTrend] = useState<{ day: string; count: number }[]>([]);
  const [trendTotals, setTrendTotals] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const onOpen = (e: any) => { 
        const d = e?.detail||{};
        if (d.groupId) {
            setGroupId(d.groupId); 
            setUserId(d.userId); 
            setPage(1);
            setOpen(true);
        }
    };
    window.addEventListener('open-nudges', onOpen);
    return () => window.removeEventListener('open-nudges', onOpen);
  }, []);

  const qs = (withSummary = false) => {
    const offset = (page-1)*pageSize;
    const q = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    if(withSummary) q.set('summary','true');
    if(fChannel) q.set('channel', fChannel);
    if(fCode) q.set('code', fCode);
    if(fFrom) q.set('from', fFrom);
    if(fTo) q.set('to', fTo);
    return q.toString();
  };

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
        const filters = { channel: fChannel, code: fCode, from: fFrom, to: fTo, limit: pageSize, offset: (page-1)*pageSize, summary: true };
        const data = await getNudges(groupId, userId, filters);
        setRows(data.rows);
        setTotal(data.total);
        if (data.summary) setSummary(data.summary);
    } catch(e: any) {
        addToast({ title: "Error", desc: e.message || "Could not load nudges", emoji: "😥" });
    } finally {
        setLoading(false);
    }
  }, [groupId, userId, page, fChannel, fCode, fFrom, fTo, addToast]);
    
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open || !groupId) return;
    (async () => {
        try {
            const params = new URLSearchParams(userId ? { userId, days: '14' } : { days: '14' });
            // This fetch call is for a server-side API route which is not part of the provided files.
            // We will assume it works as intended or fails gracefully.
            const res = await fetch(`/api/analytics/ajo/${groupId}/nudges/trend?${params.toString()}`);
            if (res.ok) {
                const j = await res.json();
                setTrend(j.series || []);
                setTrendTotals(j.byChannel || {});
            }
        } catch (e) {
            console.error("Failed to fetch trend", e);
        }
    })();
  }, [open, groupId, userId]);
    
  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast({ title: 'Copied!', desc: 'Message content copied to clipboard.', emoji: '📋' });
  };
  
  const resend = async (nudge: any) => {
    addToast({ title: 'Action Sent', desc: 'Re-sending nudge...', emoji: '🚀' });
    try {
        // Direct fetch to API endpoint for consistency with other actions in this modal
        // This fetch call is for a server-side API route which is not part of the provided files.
        const r = await fetch(`/api/analytics/ajo/${groupId}/member/${nudge.user_id}/remind`, { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify({ channel: nudge.channel, body: nudge.payload.body, tone: 'naija' })
        });
        if (!r.ok) throw new Error('Failed to resend');
        addToast({ title: 'Resent!', desc: 'The nudge has been re-queued for delivery.', emoji: '✅' });
    } catch (e) {
        addToast({ title: "Error", desc: "Could not resend nudge.", emoji: "😥" });
    }
  };

  const exportCsv = () => {
      const q = new URLSearchParams();
      if (userId) q.set('userId', userId);
      if (fChannel) q.set('channel', fChannel);
      if (fCode) q.set('code', fCode);
      if (fFrom) q.set('from', fFrom);
      if (fTo) q.set('to', fTo);
      const url = `/api/analytics/ajo/${groupId}/nudges/export?`+q.toString();
      window.open(url, '_blank');
      addToast({ title: "CSV export initiated!", desc: "Your download will begin in a new tab.", emoji: "ℹ️" });
  };

  async function bulkResend() {
    if (running) return;
    const tone = (typeof window !== 'undefined' && (localStorage.getItem('ttfPrevTone') || 'naija')) as 'naija' | 'formal' | 'strict';

    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (fChannel) params.set('channel', fChannel);
    if (fCode) params.set('code', fCode);
    if (fFrom) params.set('from', fFrom);
    if (fTo) params.set('to', fTo);
    params.set('limit', '1');
    params.set('offset', '0');
    params.set('summary', 'true');
    
    let estTotal = 0;
    try {
        const estUrl = `/api/analytics/ajo/${groupId}/nudges?${params.toString()}`;
        const estRes = await fetch(estUrl);
        const estJson = await estRes.json();
        estTotal = estJson.total || 0;
    } catch {
        addToast({ title: 'Could not estimate total', desc: 'Proceeding with caution.', emoji: '⚠️' });
    }

    if (!confirm(`This will re-send reminders to approximately ${estTotal} matching entries. Proceed?`)) return;

    setRunning(true);
    addToast({ title: `Queueing ${estTotal} reminders...`, desc: 'This may take a moment.', emoji: '⏳' });
    try {
      const body = { userId, channel: fChannel || undefined, code: fCode || undefined, from: fFrom || undefined, to: fTo || undefined, tone };
      const r = await fetch(`/api/analytics/ajo/${groupId}/nudges/resend-bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error('Server error');
      const j = await r.json();
      addToast({ title: 'Bulk re-send done', desc: `${j.queued}/${j.total} messages queued.`, emoji: '✅' });
    } catch(err) {
      console.error(err);
      addToast({ title: 'Bulk re-send failed', desc: 'An error occurred during the operation.', emoji: '😥' });
    } finally {
      setRunning(false);
    }
  }

  if(!open) return null;
  
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const chips = ['sms','whatsapp','email','inapp'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => !running && setOpen(false)}>
      <div className="w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl bg-white shadow-2xl border" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b space-y-3 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{userId ? `Nudges for member` : `Group Nudges`}</div>
            <div className="flex items-center gap-2">
              <MiniSparkline data={trend} height={24} width={120} />
              <div className="text-xs text-gray-500">Page {page} / {totalPages}</div>
              <button onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1 || running} className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50">Prev</button>
              <button onClick={()=> setPage(p=> Math.min(totalPages, p+1))} disabled={page>=totalPages || running} className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50">Next</button>
              <button onClick={load} disabled={running} className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50">Refresh</button>
              <button onClick={exportCsv} disabled={running} className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50">Export CSV</button>
              <button onClick={() => !running && setOpen(false)} disabled={running} className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50">Close</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {chips.map(ch=> (
              <button key={ch} onClick={()=> { setFChannel(fChannel===ch? '' : ch); setPage(1); }} className={`px-2 py-1 rounded-full border ${fChannel===ch? 'bg-slate-900 text-white':''}`}>
                {ch.toUpperCase()} {(summary[ch] || trendTotals[ch]) ? `(${(summary[ch] || trendTotals[ch])})` : ''}
              </button>
            ))}
            <button onClick={()=> { setFChannel(''); setPage(1); }} className="px-2 py-1 rounded-full border">Clear</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <input 
                value={fCode} 
                onChange={e=> setFCode(e.target.value)} 
                placeholder="Code contains…" 
                className="border rounded-lg px-2 py-1 bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent" 
                style={{ backgroundColor: '#ffffff', color: '#111827' }}
            />
            <input type="date" value={fFrom} onChange={e=> setFFrom(e.target.value)} className="border rounded-lg px-2 py-1 bg-white text-gray-900" />
            <input type="date" value={fTo} onChange={e=> setFTo(e.target.value)} className="border rounded-lg px-2 py-1 bg-white text-gray-900" />
            <button onClick={()=> { setPage(1); load() }} className="px-2 py-1 rounded-lg border bg-slate-50">Apply Filters</button>
          </div>
           <div className="flex items-center justify-end">
             <button onClick={bulkResend} disabled={running} className="px-3 py-1.5 rounded-lg border text-xs bg-amber-50 border-amber-200 text-amber-800 font-semibold disabled:opacity-50">
               {running ? 'Bulk re-sending…' : 'Bulk re-send (filtered)'}
             </button>
           </div>
        </div>
        <div className="p-4 overflow-y-auto">
          {loading && <div className="text-xs text-gray-500 text-center p-4">Loading…</div>}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50"><tr>
                  {!userId && <th className="p-2 text-left">User</th>}
                  <th className="p-2 text-left">Channel</th><th className="p-2 text-left">Code</th><th className="p-2 text-left">When</th>
                  <th className="p-2 text-left">Preview</th><th className="p-2 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {!loading && rows.map((n, i) => {
                    const preview = n.payload?.body?.slice(0, 120) || '—';
                    return (
                        <tr key={i} className="border-b">
                            {!userId && <td className="p-2 font-mono">{n.user_id.slice(0, 8)}...</td>}
                            <td className="p-2 uppercase">{n.channel || 'inapp'}</td>
                            <td className="p-2 font-mono">{n.code || '—'}</td>
                            <td className="p-2">{timeAgo(n.created_at)}</td>
                            <td className="p-2 text-gray-600">{preview}</td>
                            <td className="p-2"><div className="flex items-center gap-2">
                                <button className="px-2 py-1 rounded-lg border" onClick={() => resend(n)}>Re-send</button>
                                <button className="px-2 py-1 rounded-lg border" onClick={() => copy(n.payload?.body || '')}>Copy</button>
                            </div></td>
                        </tr>
                    );
                })}
                {!loading && rows.length === 0 && (<tr><td className="p-4 text-center text-gray-400" colSpan={userId ? 5 : 6}>No nudges found.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NudgesModal;