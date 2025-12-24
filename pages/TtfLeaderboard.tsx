
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Page } from '../App';
import type { TtfEntry, AjoMemberDetails } from '../types';
import { getTtfLeaderboard, getTtfPreview } from '../services/analyticsService';
import SimpleChartPlaceholder from '../components/admin/analytics/SimpleChartPlaceholder';
import { useToasts } from '../components/ToastHost';

function fmtHours(h:number|null){
  if(h===null || h===undefined) return '—'
  const sign = h<0 ? '-' : ''
  const abs = Math.abs(h)
  const d = Math.floor(abs/24)
  const rem = Math.round(abs % 24)
  return d>0 ? `${sign}${d}d ${rem}h` : `${sign}${rem}h`
}

const HoverPreview: React.FC<{ type: 'group'|'member', groupId: string, userId?: string, children: React.ReactNode }> = ({ type, groupId, userId, children }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const timer = useRef<any>(null);
    const { add: addToast } = useToasts();

    const load = async () => {
        if(data || loading) return;
        setLoading(true);
        try {
            const previewData = await getTtfPreview(groupId, userId);
            setData(previewData);
        } catch (e: any) {
             addToast({ title: 'Error', desc: e.message || 'Could not load preview', emoji: '😥'});
        } finally { setLoading(false) }
    };

    const onEnter = () => { timer.current = setTimeout(() => { setOpen(true); load() }, 200) };
    const onLeave = () => { clearTimeout(timer.current); setOpen(false) };

    const handleRemind = async (ev: React.MouseEvent<HTMLButtonElement>) => {
        const btn = ev.currentTarget as HTMLButtonElement;
        const toneSel = (document.getElementById('ttf-prev-tone') as HTMLSelectElement)?.value || 'naija';
        const chanSel = (document.getElementById('ttf-prev-chan') as HTMLSelectElement)?.value || 'sms';
        btn.disabled = true;
        try{
          // NOTE: This uses fetch directly as per the user request, bypassing the service layer for this specific UI component.
          const r = await fetch(`/api/analytics/ajo/${groupId}/member/${userId}/remind`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ channel: chanSel, tone: toneSel })
          });
          if(r.ok){
            try { localStorage.setItem('ttfPrevTone', toneSel); localStorage.setItem('ttfPrevChan', chanSel); } catch {}
            addToast({ title: 'Reminder queued', desc: 'The reminder has been sent for delivery.', emoji: '✅' });
          } else {
            addToast({ title: 'Failed to queue reminder', desc: 'The server could not process the request.', emoji: '😥' });
          }
        } catch {
          addToast({ title: 'Failed to queue reminder', desc: 'An unexpected error occurred.', emoji: '😥' });
        } finally {
          btn.disabled = false;
        }
      };
      
    const openComposer = () => {
        window.dispatchEvent(new CustomEvent('open-composer', { detail: { groupId, userId } }));
        addToast({ title: 'Opening composer…', desc: 'The detailed composer is opening in the member view.', emoji: 'ℹ️' });
    };

    return (
        <span className="relative inline-block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            {children}
            {open && (
                <div className="absolute z-50 mt-1 w-80 rounded-2xl border bg-white shadow-xl p-3">
                    <div className="text-xs text-gray-500 mb-2">{type==='group'?'Group':'Member'} preview</div>
                    {(!data && loading) && <div className="text-xs text-gray-400">Loading…</div>}
                    {data && (
                      <>
                        <div className="flex items-center gap-4 text-sm">
                            <div><div className="text-gray-500 text-xs">Paid</div><div className="font-semibold">{data.paid}</div></div>
                            <div><div className="text-gray-500 text-xs">Early %</div><div className="font-semibold">{Math.round((data.early_pct||0)*100)}%</div></div>
                            <div><div className="text-gray-500 text-xs">Avg TTF</div><div className="font-semibold">{fmtHours(data.avg_ttf_hours)}</div></div>
                        </div>
                        
                        {/* Quick remind footer (only for member preview) */}
                        {userId && (
                          <div className="flex items-center gap-2 pt-2 mt-2 border-t">
                            <span className="text-xs text-gray-500">Quick remind:</span>

                            <select
                              id="ttf-prev-tone"
                              className="border rounded-lg px-2 py-1 text-xs"
                              defaultValue={(typeof window!=='undefined' && localStorage.getItem('ttfPrevTone')) || 'naija'}
                            >
                              <option value="naija">naija</option>
                              <option value="formal">formal</option>
                              <option value="strict">strict</option>
                            </select>

                            <select
                              id="ttf-prev-chan"
                              className="border rounded-lg px-2 py-1 text-xs"
                              defaultValue={(typeof window!=='undefined' && localStorage.getItem('ttfPrevChan')) || 'sms'}
                            >
                              <option value="sms">SMS</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="email">Email</option>
                            </select>

                            <button
                              className="px-2 py-1 rounded-lg border text-xs"
                              onClick={handleRemind}
                            >
                              Remind now
                            </button>

                            <button
                              className="px-2 py-1 rounded-lg border text-xs"
                              onClick={openComposer}
                            >
                              Open composer
                            </button>
                          </div>
                        )}
                      </>
                    )}
                </div>
            )}
        </span>
    );
};


const TtfLeaderboard: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const [scope, setScope] = useState<'members'|'groups'>('members');
  const [days, setDays] = useState<number>(180);
  const [minP, setMinP] = useState<number>(3);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<TtfEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> { 
    setLoading(true);
    getTtfLeaderboard(scope, days, minP).then(setRows).finally(() => setLoading(false)) 
  }, [scope, days, minP]);

  const filtered = useMemo(()=>
    (rows || []).filter((r) => {
      const needle = q.trim().toLowerCase();
      if(!needle) return true;
      if(scope === 'groups') return r.title?.toLowerCase().includes(needle);
      return r.member_name?.toLowerCase().includes(needle);
    }), [rows, q, scope]);

  return (
    <div className="space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
            {/* Filters */}
            <div className="rounded-2xl p-4 bg-white border"><div className="text-sm text-gray-500">Scope</div><div className="flex gap-2 mt-2"><button onClick={()=> setScope('members')} className={`px-3 py-2 text-sm rounded-xl border ${scope==='members'?'bg-slate-900 text-white':''}`}>Members</button><button onClick={()=> setScope('groups')} className={`px-3 py-2 text-sm rounded-xl border ${scope==='groups'?'bg-slate-900 text-white':''}`}>Groups</button></div></div>
            <div className="rounded-2xl p-4 bg-white border"><div className="text-sm text-gray-500">Window</div><div className="flex gap-2 mt-2">{[30,90,180].map(d=> (<button key={d} onClick={()=> setDays(d)} className={`px-3 py-2 text-sm rounded-xl border ${days===d?'bg-slate-900 text-white':''}`}>{d}d</button>))}</div></div>
            <div className="rounded-2xl p-4 bg-white border"><div className="text-sm text-gray-500">Min Payments</div><input type="number" className="mt-2 border rounded-xl px-3 py-2 w-24 text-sm" value={minP} min={1} onChange={e=> setMinP(Math.max(1, Number(e.target.value||1)))} /></div>
            <div className="rounded-2xl p-4 bg-white border"><div className="text-sm text-gray-500">Search</div>
              <input 
                value={q} 
                onChange={e=> setQ(e.target.value)} 
                placeholder={scope==='groups'? 'Group title':'Member name'} 
                className="mt-2 border rounded-xl px-3 py-2 w-full text-sm bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent" 
                style={{ backgroundColor: '#ffffff', color: '#111827' }}
              />
            </div>
        </div>

        <div className="rounded-2xl p-4 bg-white border">
            <div className="font-semibold mb-2">Top‑10 Fastest {scope==='groups'? 'Groups':'Members'} (Avg TTF)</div>
            <div className="h-64"><SimpleChartPlaceholder title="Top 10 TTF Chart" /></div>
        </div>

        <div className="rounded-2xl overflow-auto border bg-white">
            <table className="min-w-full text-sm">
                <thead><tr className="bg-slate-50 text-left border-b"><th className="p-3">#</th><th className="p-3">{scope==='groups'? 'Group' : 'Member'}</th>{scope==='members' && <th className="p-3">Group Title</th>}<th className="p-3">Avg TTF</th><th className="p-3">Median TTF</th><th className="p-3">Early Pay %</th><th className="p-3">Payments</th><th className="p-3">Last Activity</th></tr></thead>
                <tbody>
                    {loading ? (<tr><td colSpan={8} className="p-6 text-center">Loading...</td></tr>) : filtered.map((r, idx) => (
                        <tr key={r.group_id + (r.user_id || '')} className="border-b">
                            <td className="p-3">{idx+1}</td>
                            <td className="p-3 font-medium">
                                <HoverPreview type={scope === 'groups' ? 'group' : 'member'} groupId={r.group_id} userId={r.user_id}>
                                    <button onClick={() => {
                                        if (scope === 'groups') {
                                            setPage('ajoGroupDetail', { group: r });
                                        } else {
                                            setPage('ajoMemberDetail', { member: r });
                                        }
                                    }} className="underline decoration-dotted hover:decoration-solid text-left text-brand hover:text-brand-700">
                                      {scope === 'groups' ? r.title : r.member_name}
                                    </button>
                                </HoverPreview>
                            </td>
                            {scope==='members' && <td className="p-3">
                                <HoverPreview type="group" groupId={r.group_id}>
                                    <button onClick={() => setPage('ajoGroupDetail', { group: r })} className="underline decoration-dotted hover:decoration-solid text-left text-brand hover:text-brand-700">
                                        {r.title}
                                    </button>
                                </HoverPreview>
                            </td>}
                            <td className="p-3">{fmtHours(r.avg_ttf_hours)}</td>
                            <td className="p-3">{fmtHours(r.p50_ttf_hours)}</td>
                            <td className="p-3">{Math.round(r.early_ratio*100)}%</td>
                            <td className="p-3">{r.payments_done.toLocaleString()}</td>
                            <td className="p-3">{r.last_activity ? new Date(r.last_activity).toLocaleString() : '—'}</td>
                        </tr>
                    ))}
                    {!loading && filtered.length===0 && (<tr><td colSpan={8} className="p-6 text-center text-gray-500">No results for current filters.</td></tr>)}
                </tbody>
            </table>
        </div>
    </div>
  );
}

export default TtfLeaderboard;