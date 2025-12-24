
import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../App';
import type { PoolTreasuryPolicy, LiquidityPosition } from '../types';
import { getPoolTreasuryData, updatePoolTreasuryPolicy, ConsolidatedTreasuryData } from '../services/treasuryService';
import { useToasts } from '../components/ToastHost';

const nf = (n: number) => `₦${n.toLocaleString()}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface TreasuryProps {
    setPage: (page: Page, context?: any) => void;
    poolId?: string;
    orgId?: string;
}

const Treasury: React.FC<TreasuryProps> = ({ setPage, poolId }) => {
    const [data, setData] = useState<ConsolidatedTreasuryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { add: addToast } = useToasts();

    const loadData = useCallback(async () => {
        if (!poolId) return;
        setLoading(true);
        try {
            const result = await getPoolTreasuryData(poolId);
            setData(result);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load treasury data.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [poolId, addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handlePolicyChange = (key: keyof PoolTreasuryPolicy, value: any) => {
        if (!data) return;
        setData(d => d ? ({ ...d, policy: { ...d.policy, [key]: value } }) : null);
    };

    const handleSave = async () => {
        if (!data || !poolId) return;
        setIsSaving(true);
        try {
            await updatePoolTreasuryPolicy(poolId, data.policy);
            addToast({ title: 'Request Submitted', desc: 'Policy changes have been submitted for admin approval.', emoji: '📝' });
            // Don't reload data immediately, as changes are pending approval
        } catch(e: any) {
            addToast({ title: 'Error', desc: 'Could not submit policy request.', emoji: '😥' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!poolId) {
        return (
            <div className="text-center p-8">
                <p>No pool selected. Please navigate from the Pool Health dashboard.</p>
                <button onClick={() => setPage('poolHealth')} className="mt-2 text-sm text-brand underline">Go to Pool Health</button>
            </div>
        );
    }

    if (loading) {
        return <div>Loading treasury controls for pool {poolId}...</div>
    }

    if (!data) {
        return <div className="text-center p-8 text-rose-700">Could not load data for this pool.</div>
    }
    
    const { policy, liquidity, opsHealth, poolName } = data;

    return (
        <div className="space-y-4">
            <button onClick={() => setPage('poolHealth')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Pool Health</button>
            <h2 className="text-2xl font-semibold">Treasury: <span className="text-brand">{poolName}</span></h2>

            {/* Ops Health Banner */}
            <div className={`rounded-2xl border p-3 flex items-center gap-3 text-sm font-medium ${opsHealth.errors_24h > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <span>{opsHealth.errors_24h} errors and {opsHealth.warns_24h} warnings in the last 24h.</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Liquidity Snapshot */}
                    <div className="rounded-2xl border bg-white p-4">
                        <h3 className="font-semibold mb-2">Liquidity Position</h3>
                        <div className="text-3xl font-bold text-brand">{nf(liquidity.draw_capacity)}</div>
                        <div className="text-sm text-gray-500">Available Draw Capacity</div>
                        <ul className="text-xs space-y-1 mt-3 pt-3 border-t">
                            <li className="flex justify-between"><span>(+) Total Locked</span> <span>{nf(liquidity.total_locked)}</span></li>
                            <li className="flex justify-between text-rose-600"><span>(-) Min Reserve ({pct(liquidity.min_reserve_pct)})</span> <span>-{nf(liquidity.total_locked * liquidity.min_reserve_pct)}</span></li>
                            <li className="flex justify-between text-rose-600"><span>(-) Volatility Buffer ({pct(liquidity.vol_buf)})</span> <span>-{nf(liquidity.total_locked * liquidity.vol_buf)}</span></li>
                            <li className="flex justify-between text-rose-600"><span>(-) Next 14d Obligations</span> <span>-{nf(liquidity.next_14d_due)}</span></li>
                            <li className="flex justify-between text-rose-600"><span>(-) Pending Draws</span> <span>-{nf(liquidity.pending_draws)}</span></li>
                        </ul>
                    </div>
                    {/* Kill Switches */}
                    <div className="rounded-2xl border bg-white p-4">
                         <h3 className="font-semibold mb-2">Emergency Kill Switches</h3>
                         <div className="space-y-2">
                             {(['kill_draws', 'kill_unlocks', 'kill_payments'] as const).map(key => (
                                <label key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border has-[:checked]:bg-rose-50 has-[:checked]:border-rose-200">
                                    <span className="text-sm font-medium capitalize">{key.replace('kill_', '')}</span>
                                    <input type="checkbox" className="h-4 w-4 rounded" checked={policy[key]} onChange={e => handlePolicyChange(key, e.target.checked)} />
                                </label>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 rounded-2xl border bg-white p-4 space-y-4">
                    <h3 className="font-semibold">Policy & Limits</h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="font-medium text-gray-700">Max Draw Pct</label>
                            <input type="number" step="0.01" value={policy.max_draw_pct} onChange={e => handlePolicyChange('max_draw_pct', parseFloat(e.target.value))} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                        <div>
                            <label className="font-medium text-gray-700">Min Reserve Pct</label>
                            <input type="number" step="0.01" value={policy.min_reserve_pct} onChange={e => handlePolicyChange('min_reserve_pct', parseFloat(e.target.value))} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                    </div>
                     <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <label className="font-medium text-gray-700">User Daily Draw (₦)</label>
                            <input type="number" step="1000" value={policy.per_user_daily_draw_ngn} onChange={e => handlePolicyChange('per_user_daily_draw_ngn', parseInt(e.target.value))} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                         <div>
                            <label className="font-medium text-gray-700">Org Daily Draw (₦)</label>
                            <input type="number" step="10000" value={policy.per_org_daily_draw_ngn} onChange={e => handlePolicyChange('per_org_daily_draw_ngn', parseInt(e.target.value))} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                         <div>
                            <label className="font-medium text-gray-700">User Daily Unlock (₦)</label>
                            <input type="number" step="1000" value={policy.per_user_daily_unlock_ngn} onChange={e => handlePolicyChange('per_user_daily_unlock_ngn', parseInt(e.target.value))} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-xl bg-brand text-white font-semibold hover:bg-brand-700 transition disabled:opacity-50">
                            {isSaving ? 'Request Change' : 'Request Change'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Note: Policy updates require approval from another admin.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Treasury;
