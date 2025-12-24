import React, { useEffect, useState, useCallback } from 'react';
import { getPoolsForModeration, closePool, refundPool } from '../../services/adminService';
// FIX: Aliased LegacyPool to Pool to match usage, as Pool type was renamed.
import type { LegacyPool as Pool } from '../../types';
import { useToasts } from '../ToastHost';

const PoolModeration: React.FC = () => {
    const [pools, setPools] = useState<Pool[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const { add: addToast } = useToasts();

    const fetchPools = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPoolsForModeration();
            setPools(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not fetch pools.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchPools();
    }, [fetchPools]);
    
    const handleAction = async (action: 'close' | 'refund', poolId: string, reason: string) => {
        if (!reason) {
            addToast({ title: 'Reason Required', desc: 'Please provide a reason for this action.', emoji: '📝' });
            return;
        }
        setSubmitting(`${action}-${poolId}`);
        try {
            if (action === 'close') {
                await closePool(poolId, reason);
                addToast({ title: 'Pool Closed', desc: 'The pool is no longer open for investment.', emoji: '✅' });
            } else {
                await refundPool(poolId, reason);
                addToast({ title: 'Refunds Processed', desc: 'All locked escrows have been returned to user wallets.', emoji: '💸' });
            }
            fetchPools();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setSubmitting(null);
        }
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const poolId = formData.get('pool_id') as string;
        const reason = formData.get('reason') as string;
        const action = (e.nativeEvent as any).submitter.name as 'close' | 'refund';
        handleAction(action, poolId, reason);
    };

    if (loading) return <div className="text-center p-4">Loading pools...</div>;

    return (
        <div className="space-y-3">
             <h2 className="font-semibold text-lg">Pool Moderation</h2>
            {pools.map(p => (
                <form key={p.id} onSubmit={handleSubmit} className="rounded-2xl border p-4 bg-white flex flex-wrap items-center justify-between gap-4">
                    <input type="hidden" name="pool_id" value={p.id} />
                    <div className="flex-grow">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-600">₦{(p.raised_amount_kobo/100).toLocaleString()} / ₦{(p.base_amount_kobo/100).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input name="reason" placeholder="Reason for action..." required className="border rounded-lg px-2 py-1.5 text-sm w-full sm:w-auto focus:ring-brand focus:border-brand" />
                        <button type="submit" name="close" disabled={!!submitting} className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white disabled:opacity-50">Close Pool</button>
                        <button type="submit" name="refund" disabled={!!submitting} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-slate-100 disabled:opacity-50">Refund All</button>
                    </div>
                </form>
            ))}
            {!pools?.length && <div className="text-gray-500 rounded-2xl border border-dashed p-6 text-center">No active pools to moderate.</div>}
        </div>
    );
};

export default PoolModeration;