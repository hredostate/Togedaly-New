// components/admin/reports/RoutingReport.tsx
'use client'
import * as React from 'react'
import { getRoutingReport } from '../../../services/reportService';
import { createMemoOverride, createBulkMemoOverrides } from '../../../services/routingService';
import { useToasts } from '../../ToastHost';
import { useToast } from '../../useToast'; // New lightweight toast
import { getAdminUserPools as getAdminUserPools } from '../../../services/poolService';
import { roleClass } from '../../roles';

const OverrideModal: React.FC<{ modalData: any, setModal: (data: any) => void, onSave: () => void }> = ({ modalData, setModal, onSave }) => {
    const { add: addToast } = useToasts();
    const [picks, setPicks] = React.useState<any[]>([]);
    
    React.useEffect(() => {
        if (modalData?.user) {
            getAdminUserPools(modalData.user.replace('user:', ''))
                .then(items => setPicks(items || []))
                .catch(() => {});
        }
    }, [modalData?.user]);

    async function saveOverride() {
        if (!modalData) return;
        try {
            await createMemoOverride(modalData.user.replace('user:', ''), modalData.narration, modalData.dest, modalData.dest_id || null);
            addToast({ title: 'Override Saved', desc: 'The new routing rule has been applied.', emoji: '✅' });
            onSave();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not save override.', emoji: '😥' });
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setModal(null)}>
            <div className="bg-white rounded-2xl p-4 w-full max-w-lg space-y-3 text-sm" onClick={e => e.stopPropagation()}>
                <div className="text-base font-medium">Create Memo Override</div>
                <div className="text-xs text-gray-600">User: <span className="font-mono">{modalData.user}</span></div>
                
                <div>
                    <label className="text-xs font-medium">Narration Key</label>
                    <input className="border rounded-xl px-3 py-2 w-full mt-1" value={modalData.narration} onChange={e=> setModal({...modalData, narration:e.target.value})} />
                </div>

                {picks.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs pt-1">
                        {picks.map(p => (
                            <button key={`${p.type}:${p.id}`} onClick={() => setModal({ ...modalData, dest: p.type, dest_id: p.id })} className="px-2 py-1 rounded-full bg-white border hover:bg-slate-100 flex items-center gap-2">
                                <span>{p.label}</span>
                                <span className={`px-2 py-[2px] rounded-full text-[10px] ${roleClass(p.role||'member')}`}>{p.role||'member'}</span>
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-medium">Destination</label>
                        <select className="border rounded-xl px-3 py-2 w-full mt-1 bg-white" value={modalData.dest || 'ajo'} onChange={e => setModal({ ...modalData, dest: e.target.value })}>
                            <option value="ajo">Ajo</option>
                            <option value="group_buy">Group Buy</option>
                            <option value="invest">Investment</option>
                            <option value="wallet">Wallet</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Destination ID (optional)</label>
                        <input className="border rounded-xl px-3 py-2 w-full mt-1" placeholder="Pool ID" value={modalData.dest_id || ''} onChange={e => setModal({ ...modalData, dest_id: e.target.value })} />
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setModal(null)} className="px-3 py-2 rounded-xl border">Cancel</button>
                    <button onClick={saveOverride} className="px-3 py-2 rounded-xl bg-slate-900 text-white">Save Override</button>
                </div>
            </div>
        </div>
    );
};

const BulkOverrideModal: React.FC<{ since?: string; bank?: string; minAmt?: string; strictBank?: string; onClose: () => void; onSaved: () => void; }> = ({ since, bank, minAmt, strictBank, onClose, onSaved }) => {
    const [bulkDest, setBulkDest] = React.useState('ajo');
    const [bulkDestId, setBulkDestId] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [dryRun, setDryRun] = React.useState(true);
    const [preview, setPreview] = React.useState<any[]>([]);
    const [feedback, setFeedback] = React.useState('');
    const [selected, setSelected] = React.useState<Record<string, string[]>>({});
    const { add: addToast } = useToasts();
    const { push: pushSimpleToast } = useToast();
    
    const runBulk = async () => {
        setSaving(true);
        setFeedback('');
        setPreview([]);
        try {
            const result = await createBulkMemoOverrides(since, bulkDest as any, bulkDestId || null, dryRun, bank || undefined, minAmt ? Number(minAmt) : undefined);
            if (dryRun) {
                setPreview(result.users || []);
                setFeedback(`Preview: ${result.users?.length || 0} user(s) will be affected.`);
            } else {
                addToast({ title: 'Bulk Create Complete', desc: `Created ${result.created} new override(s).`, emoji: '🚀'});
                onSaved();
            }
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Failed to process bulk override.', emoji: '😥' });
            setFeedback(e.message || 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl p-4 w-full max-w-4xl space-y-3 text-sm" onClick={e => e.stopPropagation()}>
                <div className="text-base font-medium">Create Overrides from ALL Unrouted</div>
                <p className="text-xs text-gray-600">This will create memo overrides for each unique (user, narration) pair in the current filtered window, pointing them to a single destination.</p>
                
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-medium">Destination</label>
                        <select className="border rounded-xl px-3 py-2 w-full mt-1 bg-white" value={bulkDest} onChange={e => setBulkDest(e.target.value)}>
                            <option value="ajo">Ajo</option>
                            <option value="group_buy">Group Buy</option>
                            <option value="invest">Investment</option>
                            <option value="wallet">Wallet</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Destination ID (optional)</label>
                        <input className="border rounded-xl px-3 py-2 w-full mt-1" placeholder="Pool ID" value={bulkDestId} onChange={e => setBulkDestId(e.target.value)} />
                    </div>
                </div>

                <label className="text-xs flex items-center gap-2 pt-2"><input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} /> Dry-run first</label>

                {preview.length > 0 && (
                  <div className="max-h-80 overflow-auto border rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-left sticky top-0">
                        <tr><th className="p-2">User</th><th className="p-2">#Keys</th><th className="p-2">Total (₦)</th><th className="p-2">Samples</th><th className="p-2">Actions</th></tr>
                      </thead>
                      <tbody>
                        {preview.map((u:any, i:number)=> (
                          <tr key={i} className="border-t align-top">
                            <td className="p-2 font-mono">{u.user}</td>
                            <td className="p-2">{u.count}</td>
                            <td className="p-2">{u.total.toLocaleString()}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {u.rows.map((r:any, j:number)=> (
                                  <button key={j} onClick={async ()=>{
                                    try {
                                      await createMemoOverride(u.user.replace('user:', ''), r.narration, bulkDest as any, bulkDestId || null);
                                      pushSimpleToast('success', 'Promoted');
                                      setPreview(prev => prev.map(p => p.user === u.user ? { ...p, count: Math.max(0, p.count - 1) } : p));
                                    } catch(e: any) {
                                      pushSimpleToast('error', 'Failed to promote');
                                    }
                                  }} className={`px-2 py-1 rounded-full border bg-white hover:bg-slate-100 text-left ${(selected[u.user] || []).includes(r.narration) ? 'ring-2 ring-slate-800' : ''}`} title={`Promote to create single override. Total: ₦${r.total.toLocaleString()}`}>
                                    {r.narration}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 space-x-1 whitespace-nowrap">
                                <button onClick={()=> setSelected(s=> ({ ...s, [u.user]: (u.rows||[]).map((x:any)=> x.narration) }))} className="px-2 py-1 rounded-lg border">All</button>
                                <button onClick={()=> setSelected(s=> ({ ...s, [u.user]: [] }))} className="px-2 py-1 rounded-lg border">Clear</button>
                                <button onClick={async ()=>{
                                    const list = selected[u.user]||[];
                                    if(list.length===0){ pushSimpleToast('info','Nothing selected'); return }
                                    let okc=0, failc=0;
                                    for(const nar of list){
                                        try {
                                            await createMemoOverride(u.user.replace('user:', ''), nar, bulkDest as any, bulkDestId || null);
                                            okc++;
                                        } catch { failc++; }
                                    }
                                    pushSimpleToast('success',`Promoted ${okc}${failc?`, ${failc} failed`:''}`);
                                    setPreview(prev=> prev.map(p=> p.user===u.user? { ...p, count: Math.max(0,p.count-okc) }: p));
                                }} className="px-2 py-1 rounded-lg bg-slate-900 text-white">Promote Sel.</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="flex gap-2 justify-end pt-2 items-center">
                    {feedback && <span className="text-xs text-gray-600 mr-auto">{feedback}</span>}
                    <button onClick={onClose} className="px-3 py-2 rounded-xl border">Cancel</button>
                    <button onClick={runBulk} disabled={saving} className="px-3 py-2 rounded-xl bg-slate-900 text-white">
                        {saving ? '...' : (dryRun ? 'Run Dry-run' : 'Confirm & Save')}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function RoutingReport() {
    const [since, setSince] = React.useState('');
    const [bank, setBank] = React.useState('');
    const [minAmt, setMinAmt] = React.useState('');
    const [strictBank, setStrictBank] = React.useState('');
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [modal, setModal] = React.useState<any>(null);
    const [bulkOverrideOpen, setBulkOverrideOpen] = React.useState(false);
    const { add: addToast } = useToasts();

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const reportData = await getRoutingReport(since || undefined, bank || undefined, minAmt ? Number(minAmt) : undefined, strictBank || undefined);
            setData(reportData);
        } catch (e: any) {
            addToast({ title: "Error", desc: e.message || "Failed to load report", emoji: "😥" });
        } finally {
            setLoading(false);
        }
    }, [since, bank, minAmt, strictBank, addToast]);

    React.useEffect(() => { load() }, [load]);
    
    async function downloadCsv(){
        addToast({ title: 'Generating CSV...', desc: 'Your download will begin shortly.', emoji: '📄' });
        
        const filteredData = await getRoutingReport(since || undefined, bank || undefined, minAmt ? Number(minAmt) : undefined, strictBank || undefined);

        const header = 'when,user,amount_ngr,narration,sender_bank\n';
        const lines = (filteredData?.unrouted || []).map((r: any) => {
            const when = new Date(r.when).toISOString();
            const user = r.user || '';
            const amt = (r.amount_kobo || 0) / 100;
            const nar = `"${(r.narration || '').replaceAll('"', '""')}"`;
            const sender = `"${(r.sender_bank || '').replaceAll('"', '""')}"`;
            return [when, user, amt, nar, sender].join(',');
        }).join('\n');
        
        const blob = new Blob([header + lines], { type: 'text/csv; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unrouted_credits.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    const counts = data?.counts || {};
    const unrouted = data?.unrouted || [];

    return (
        <div className="space-y-4">
            <div className="rounded-2xl bg-white border p-4 space-y-3 text-sm">
                <div className="flex flex-wrap gap-2 items-center">
                    <input className="border rounded-xl px-3 py-2" type="date" value={since} onChange={e => setSince(e.target.value)} />
                    <input className="border rounded-xl px-3 py-2" placeholder="Bank in narration" value={bank} onChange={e => setBank(e.target.value)} />
                    <input className="border rounded-xl px-3 py-2" placeholder="Strict bank name" value={strictBank} onChange={e => setStrictBank(e.target.value)} />
                    <input className="border rounded-xl px-3 py-2 w-24" placeholder="Min ₦" type="number" value={minAmt} onChange={e => setMinAmt(e.target.value)} />
                    <button onClick={load} disabled={loading} className="px-3 py-2 rounded-xl border disabled:opacity-50">
                        {loading ? '...' : 'Refresh'}
                    </button>
                     <button onClick={downloadCsv} disabled={loading || !unrouted.length} className="px-3 py-2 rounded-xl border disabled:opacity-50">
                        Export CSV
                    </button>
                    <button onClick={() => setBulkOverrideOpen(true)} disabled={loading || !unrouted.length} className="px-3 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50">
                        Bulk Override...
                    </button>
                </div>
                {loading ? <div className="text-center p-4">Loading report data...</div> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="rounded-xl border p-3 bg-slate-50"><div className="text-xs text-gray-500">Memo Override</div><div className="text-2xl font-semibold">{counts.memo_override || 0}</div></div>
                        <div className="rounded-xl border p-3 bg-slate-50"><div className="text-xs text-gray-500">Memo Tag</div><div className="text-2xl font-semibold">{counts.memo_tag || 0}</div></div>
                        <div className="rounded-xl border p-3 bg-slate-50"><div className="text-xs text-gray-500">User Default</div><div className="text-2xl font-semibold">{counts.user_default || 0}</div></div>
                        <div className="rounded-xl border p-3 bg-amber-50 border-amber-200"><div className="text-xs text-amber-800">Unrouted</div><div className="text-2xl font-semibold text-amber-900">{counts.default_to_wallet || 0}</div></div>
                    </div>
                )}
            </div>

            <div className="rounded-2xl bg-white border p-4 space-y-3 text-sm">
                <div className="text-sm font-medium">Unrouted Credits (defaulted to wallet)</div>
                <div className="rounded-xl border overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                            <tr><th className="p-2">When</th><th className="p-2">User</th><th className="p-2">Amount</th><th className="p-2">Narration</th><th className="p-2">Bank</th><th className="p-2">Action</th></tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> : (
                                unrouted.map((r: any, i: number) => (
                                    <tr key={i} className="border-t">
                                        <td className="p-2 text-xs">{new Date(r.when).toLocaleString()}</td>
                                        <td className="p-2 font-mono text-xs">{r.user}</td>
                                        <td className="p-2"><span className="px-2 py-1 rounded-full bg-slate-100">₦{((r.amount_kobo||0)/100).toLocaleString()}</span></td>
                                        <td className="p-2 font-mono text-xs">{r.narration || ''}</td>
                                        <td className="p-2"><span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs">{r.sender_bank||'—'}</span></td>
                                        <td className="p-2"><button onClick={()=> setModal({ user:r.user, narration:r.narration||'', dest: 'ajo' })} className="px-2 py-1 rounded-lg border text-xs">Create Override</button></td>
                                    </tr>
                                ))
                            )}
                            {!loading && unrouted.length === 0 && (<tr><td colSpan={6} className="p-4 text-center text-gray-500">No unrouted credits in this period.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {modal && <OverrideModal modalData={modal} setModal={setModal} onSave={() => { setModal(null); load(); }} />}
            {bulkOverrideOpen && <BulkOverrideModal since={since || undefined} bank={bank} minAmt={minAmt} strictBank={strictBank} onClose={() => setBulkOverrideOpen(false)} onSaved={() => { setBulkOverrideOpen(false); load(); }} />}

        </div>
    );
}