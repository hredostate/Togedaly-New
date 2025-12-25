import React, { useState, useEffect } from 'react';
import type { UserRiskProfile } from '../../types';
import { getAdminUserRiskProfiles } from '../../services/riskService';
import { revalidateKyc } from '../../services/riskService';
import { useToasts } from '../ToastHost';

const RiskBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score > 80 ? 'bg-rose-100 text-rose-800 border-rose-200' 
              : score > 40 ? 'bg-amber-100 text-amber-800 border-amber-200' 
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';
  return <span className={`px-2 py-[3px] rounded-lg border text-xs font-medium ${color}`}>{score}</span>
}

const RiskOverview: React.FC = () => {
    const [rows, setRows] = useState<UserRiskProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { add: addToast } = useToasts();
    
    useEffect(() => {
        setLoading(true);
        getAdminUserRiskProfiles()
            .then(setRows)
            .catch((e: unknown) => addToast({ title: 'Error', desc: (e as Error).message || 'Could not load risk profiles', emoji: '😥'}))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    async function revalidate(r:UserRiskProfile){
        try {
            const res = await revalidateKyc(r.user_id);
            if (res.ok) {
                addToast({ title: 'Queued', desc: 'Re-validation has been queued.', emoji: '✅'});
            } else {
                throw new Error('Failed to queue');
            }
        } catch(e: any) {
            addToast({ title: 'Error', desc: e.message || 'Failed to re-validate.', emoji: '😥' });
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-xl font-semibold">Risk & KYC Overview</div>
            <div className="rounded-2xl overflow-auto border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left border-b">
                        <tr>
                            <th className="p-3">User</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Provider</th>
                            <th className="p-3">Risk (30d)</th>
                            <th className="p-3">Last Event</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading risk profiles...</td></tr>}
                        {!loading && rows.map((r: any) => (
                            <tr key={r.user_id} className="border-b">
                                <td className="p-3 font-mono text-[11px]">{r.user_id}</td>
                                <td className="p-3 capitalize">{r.status}</td>
                                <td className="p-3 capitalize">{r.provider || 'N/A'}</td>
                                <td className="p-3"><RiskBadge score={r.risk_30d || 0} /></td>
                                <td className="p-3">{r.last_event_at ? new Date(r.last_event_at).toLocaleString() : '—'}</td>
                                <td className="p-3">
                                    <button onClick={()=> revalidate(r)} className="px-2 py-1 rounded-lg border text-xs">Re‑validate</button>
                                </td>
                            </tr>
                        ))}
                        {!loading && rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No user profiles found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RiskOverview;