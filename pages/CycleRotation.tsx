import React, { useState, useEffect, useCallback } from 'react';
import { useToasts } from '../components/ToastHost';
import type { Page } from '../App';
import { supabase } from '../supabaseClient';
import ReceiptUploadModal from '../components/admin/ReceiptUploadModal';
import type { Payout } from '../types';

interface CycleRotationPageProps {
  setPage: (page: Page, context?: any) => void;
  poolId: string;
  cycleId: string;
}

const CycleRotationPage: React.FC<CycleRotationPageProps> = ({ setPage, poolId, cycleId }) => {
  const [data, setData] = useState<{ rotation: any[], payouts: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [uploadingPayout, setUploadingPayout] = useState<any | null>(null);
  const { add: addToast } = useToasts();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // This logic mimics the API route defined in the documentation (index.html, section 16)
      const { data: rotation, error: rotError } = await supabase
        .from('member_slots')
        .select('user_id, slot_index, rotation_position')
        .eq('pool_id', poolId)
        .order('rotation_position', { ascending: true });
      if (rotError) throw rotError;

      const { data: payouts, error: pErr } = await supabase
        .from('cycle_payouts')
        .select('*')
        .eq('pool_id', poolId)
        .eq('cycle_id', cycleId);
      if (pErr) throw pErr;

      setData({ rotation: rotation || [], payouts: payouts || [] });
    } catch (e: any) {
      addToast({ title: "Error", desc: e.message || "Could not load cycle data.", emoji: "😥" });
    } finally {
      setLoading(false);
    }
  }, [poolId, cycleId, addToast]);

  useEffect(() => {
    if (poolId && cycleId) {
        fetchData();
    }
  }, [fetchData, poolId, cycleId]);

  async function handleRunPayouts() {
    setProcessing(true);
    try {
      // This logic mimics the API route defined in the documentation (index.html, section 17)
      const { error: rpcErr } = await supabase.rpc('run_cycle_payout', {
        p_pool_id: Number(poolId),
        p_cycle_id: Number(cycleId),
      });
      if (rpcErr) throw rpcErr;

      addToast({ title: "Payouts Processed", desc: "Payout job has been triggered. The list will update.", emoji: "🚀" });
      await new Promise(res => setTimeout(res, 500)); // Give backend a moment to process
      await fetchData(); // refetch data
    } catch(e: any) {
      addToast({ title: "Error", desc: e.message || "Failed to run payouts.", emoji: "😥" });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading cycle details...</div>
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cycle {cycleId} Rotation & Payouts</h1>
          <p className="text-sm text-gray-500">
            Review the member rotation and payout status for pool {poolId}.
          </p>
        </div>
        <button
          onClick={handleRunPayouts}
          disabled={processing}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
        >
          {processing ? 'Generating Payouts…' : 'Run Payouts Now'}
        </button>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Rotation Order</h2>
          <div className="border rounded-2xl overflow-auto bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left font-semibold">Position</th>
                  <th className="p-3 text-left font-semibold">User ID</th>
                  <th className="p-3 text-left font-semibold">Slot #</th>
                </tr>
              </thead>
              <tbody>
                {data?.rotation.map((r: any, idx: number) => (
                  <tr key={idx} className="odd:bg-gray-50/50 border-t">
                    <td className="p-3 font-medium">{r.rotation_position}</td>
                    <td className="p-3 font-mono text-xs">{r.user_id}</td>
                    <td className="p-3">{r.slot_index}</td>
                  </tr>
                ))}
                 {!data?.rotation.length && (
                    <tr><td colSpan={3} className="p-6 text-center text-gray-500">No rotation slots defined for this pool.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Generated Payouts</h2>
          <div className="border rounded-2xl overflow-auto bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left font-semibold">Beneficiary</th>
                  <th className="p-3 text-left font-semibold">Amount</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Receipt</th>
                  <th className="p-3 text-left font-semibold">Provider Ref</th>
                </tr>
              </thead>
              <tbody>
                {data?.payouts.map((p: any) => (
                  <tr key={p.id} className="odd:bg-gray-50/50 border-t">
                    <td className="p-3 font-mono text-xs">{p.beneficiary_user_id}</td>
                    <td className="p-3 font-semibold">₦{Number(p.amount).toLocaleString()}</td>
                    <td className="p-3 capitalize">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${p.status === 'settled' ? 'bg-emerald-100 text-emerald-800' : p.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>{p.status}</span>
                    </td>
                    <td className="p-3 text-xs">
                      {p.receipt_url ? (
                          <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-brand underline">View</a>
                      ) : (
                          <button onClick={() => setUploadingPayout(p)} className="text-gray-500 underline">Upload</button>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">{p.provider_ref ?? '-'}</td>
                  </tr>
                ))}
                {!data?.payouts.length && (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No payouts generated for this cycle yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
       {uploadingPayout && (
        <ReceiptUploadModal
            payoutId={uploadingPayout.id}
            payoutType={'cycle'}
            onClose={() => setUploadingPayout(null)}
            onSuccess={() => {
                setUploadingPayout(null);
                fetchData();
            }}
        />
      )}
    </div>
  );
}

export default CycleRotationPage;