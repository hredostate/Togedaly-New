
import React, { useEffect, useState } from 'react';
import { getOrgHealth, getOrgArrears, getUnlockEligibility } from '../../services/adminAnalyticsService';

const Card = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <div className={`p-4 rounded-2xl border ${color} bg-white`}>
        <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);

export default function DashboardClient({ orgId }: { orgId: string }) {
  const [health, setHealth] = useState<any>(null);
  const [arrears, setArrears] = useState<any[]>([]);
  const [unlocks, setUnlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        try {
            const [h, a, u] = await Promise.all([
                getOrgHealth(orgId),
                getOrgArrears(orgId),
                getUnlockEligibility(orgId)
            ]);
            setHealth(h);
            setArrears(a);
            setUnlocks(u);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [orgId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;

  return (
    <div className="grid gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="Active Users" value={health.active_users} color="border-blue-200 text-blue-900" />
            <Card title="MRR" value={`₦${(health.mrr/1000000).toFixed(1)}M`} color="border-emerald-200 text-emerald-900" />
            <Card title="Risk Score" value={health.risk_score} color="border-amber-200 text-amber-900" />
            <Card title="Churn" value={`${health.churn_rate}%`} color="border-slate-200 text-slate-900" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-bold text-lg mb-3">Top Arrears</h3>
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500"><th>User</th><th>Amount</th><th>Days</th></tr></thead>
                    <tbody>
                        {arrears.map((a: any, i: number) => (
                            <tr key={i} className="border-t">
                                <td className="py-2">{a.user_id}</td>
                                <td className="py-2 text-rose-600">₦{a.amount.toLocaleString()}</td>
                                <td className="py-2">{a.days_overdue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-2xl border p-4">
                <h3 className="font-bold text-lg mb-3">Unlock Eligibility</h3>
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500"><th>User</th><th>Pool</th><th>Amount</th></tr></thead>
                    <tbody>
                        {unlocks.map((u: any, i: number) => (
                            <tr key={i} className="border-t">
                                <td className="py-2">{u.user_id}</td>
                                <td className="py-2 text-gray-500">{u.pool_id}</td>
                                <td className="py-2 text-emerald-600">₦{u.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
