
// components/admin/ReapplyCredits.tsx
'use client'
import * as React from 'react'
import { getSkippedCredits, reapplyCredit, reapplyCreditBulk } from '../../services/adminService';
import { useToasts } from '../ToastHost';

export default function ReapplyCredits(){
  const [since, setSince] = React.useState('');
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [reapplying, setReapplying] = React.useState<number | null>(null);
  const { add: addToast } = useToasts();
  
  // New state for bulk operations
  const [bulkMsg, setBulkMsg] = React.useState('');
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [isDryRunning, setIsDryRunning] = React.useState(false);


  const load = React.useCallback(async (isNewQuery = true) => {
    setLoading(true);
    if(isNewQuery) {
        setCursor(undefined);
        setPage(1);
        setItems([]);
    }
    try {
        const skippedItems = await getSkippedCredits(since || undefined);
        setItems(skippedItems);
    } catch (e: any) {
        addToast({ title: 'Error', desc: e.message || 'Could not load skipped credits.', emoji: '😥' });
    } finally {
        setLoading(false);
    }
  }, [since, addToast]);

  React.useEffect(() => { load() }, [load]);

  async function reapply(tx_id: number){
    setReapplying(tx_id);
    try {
        const result = await reapplyCredit(tx_id);
        if (result.skipped) {
            addToast({ title: 'Skipped', desc: 'This credit has already been re-applied.', emoji: '🔄' });
        } else {
            addToast({ title: 'Re-applied!', desc: `Credit for transaction ${tx_id} has been processed.`, emoji: '✅' });
        }
        load();
    } catch (e: any) {
        addToast({ title: 'Error', desc: e.message || 'Failed to re-apply credit.', emoji: '😥' });
    } finally {
        setReapplying(null);
    }
  }

  // --- BULK OPERATIONS ---
  
  const runBulkDryRun = React.useCallback(async (nextCursor?: string) => {
    setIsDryRunning(true);
    setBulkMsg('');
    try {
      const j = await reapplyCreditBulk(since || undefined, 200, true, nextCursor);
      setBulkMsg(`Dry-run (Page ${nextCursor ? page + 1 : 1}): ${j.count} candidate(s) found.`);
      setItems(j.items || []);
      setCursor(j.nextCursor);
      if(nextCursor) setPage(p => p + 1);
    } catch (e: any) {
      setBulkMsg(e.message || 'Failed to run dry-run.');
      addToast({ title: 'Error', desc: e.message || 'Dry-run failed.', emoji: '😥' });
    } finally {
      setIsDryRunning(false);
    }
  }, [since, addToast, page]);
  
  async function bulkApply(){
    if (!confirm(`This will re-apply all found credits since ${since || 'the beginning of time'}. Are you sure?`)) return;
    setBulkMsg('');
    try {
      const j = await reapplyCreditBulk(since || undefined, 5000, false); // High limit for actual apply
      setBulkMsg(`Processed ${j.processed} of ${j.results.length} candidates.`);
      addToast({ title: 'Bulk Apply Done', desc: `Processed ${j.processed} credits.`, emoji: '🚀' });
      if (j.processed > 0) load();
    } catch(e: any) {
      setBulkMsg(e.message || 'Failed to apply bulk credits.');
      addToast({ title: 'Error', desc: e.message || 'Bulk apply failed.', emoji: '😥' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Admin – Re-apply Skipped Credits</div>
      <p className="text-sm text-gray-600">This tool finds incoming transfers that were logged but not credited while the `DISABLE_WALLET_CREDIT` kill-switch was active, and allows you to apply them now. This action is idempotent.</p>
      <div className="rounded-2xl bg-white border p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
            <input className="border rounded-xl px-3 py-2 text-sm" type="date" value={since} onChange={e=> setSince(e.target.value)} />
            <button onClick={() => load(true)} disabled={loading} className="px-3 py-2 rounded-xl border text-sm">
                {loading ? '...' : 'Refresh List'}
            </button>
        </div>
         <div className="flex flex-wrap gap-2 items-center border-t pt-3">
            <button onClick={() => runBulkDryRun()} disabled={isDryRunning} className="px-3 py-2 rounded-xl border text-sm">
                {isDryRunning ? '...' : 'Bulk Dry-run'}
            </button>
            {cursor && (
                <button onClick={() => runBulkDryRun(cursor)} disabled={isDryRunning} className="px-3 py-2 rounded-xl border text-sm">
                   {isDryRunning ? '...' : `Next Page (${page + 1})`}
                </button>
            )}
            <button onClick={bulkApply} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Bulk Re-apply</button>
            {bulkMsg && <div className="text-xs text-gray-600">{bulkMsg}</div>}
        </div>
      </div>
      <div className="rounded-xl border overflow-auto bg-white">
        <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
            <tr>
                <th className="p-2">When Skipped</th>
                <th className="p-2">User</th>
                <th className="p-2">Amount (₦)</th>
                <th className="p-2">Narration</th>
                <th className="p-2">Action</th>
            </tr>
            </thead>
            <tbody>
            {(loading || isDryRunning) ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : items.map((it:any, i:number) => (
                <tr key={i} className="border-t">
                <td className="p-2 text-xs">{new Date(it.when).toLocaleString()}</td>
                <td className="p-2 font-mono text-xs">{it.user}</td>
                <td className="p-2">{(it.amount_kobo||0)/100}</td>
                <td className="p-2 font-mono text-xs">{it.narration||''}</td>
                <td className="p-2">
                    <button 
                        onClick={()=> reapply(it.paystack_tx_id)} 
                        disabled={reapplying === it.paystack_tx_id}
                        className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50"
                    >
                        {reapplying === it.paystack_tx_id ? '...' : 'Re‑apply'}
                    </button>
                </td>
                </tr>
            ))}
            {!loading && !isDryRunning && items.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No skipped credits found for this period.</td></tr>
            )}
            </tbody>
        </table>
      </div>
    </div>
  )
}
      