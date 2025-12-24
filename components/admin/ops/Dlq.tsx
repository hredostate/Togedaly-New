import React, { useState, useEffect, useCallback } from 'react';
import { getDlqItems, retryDlqItem } from '../../../services/opsService';
import { useToasts } from '../../ToastHost';
import type { DlqItem } from '../../../types';

const Dlq: React.FC = () => {
    const [items, setItems] = useState<DlqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState<string | null>(null);
    const { add: addToast } = useToasts();
    
    const fetchDlq = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDlqItems();
            setItems(data);
        } catch (e) {
            addToast({ title: 'Error', desc: 'Could not fetch DLQ items.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchDlq();
    }, [fetchDlq]);

    const handleRetry = async (id: string) => {
        setRetrying(id);
        try {
            await retryDlqItem(id);
            addToast({ title: 'Success', desc: 'Item has been re-queued for processing.', emoji: '✅' });
            fetchDlq(); // Refresh list
        } catch (err: any) {
             addToast({ title: 'Error', desc: err.message, emoji: '😥' });
        } finally {
            setRetrying(null);
        }
    };

    if (loading) return <div className="text-center p-4">Loading Dead-Letter Queue...</div>;

    return (
        <div className="space-y-3">
            {items.map(r => (
                <div key={r.id} className="rounded-2xl border p-4 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                             <div className="font-semibold text-gray-800">{r.queue}</div>
                             <div className="text-sm text-gray-500">Attempts: {r.attempts} • Seen: {new Date(r.last_seen).toLocaleString()}</div>
                        </div>
                        <button 
                            onClick={() => handleRetry(r.id)}
                            disabled={retrying === r.id}
                            className="px-3 py-1.5 rounded-lg border text-sm font-semibold hover:bg-slate-100 disabled:opacity-50"
                        >
                            {retrying === r.id ? 'Retrying...' : 'Retry'}
                        </button>
                    </div>
                    <pre className="mt-2 text-xs bg-slate-50 p-2 rounded border overflow-auto max-h-48">{JSON.stringify(r.payload, null, 2)}</pre>
                    {r.error && <div className="mt-1 text-xs text-rose-600 font-mono bg-rose-50 p-2 rounded border border-rose-100">ERROR: {r.error}</div>}
                </div>
            ))}
            {!items.length && <div className="text-gray-500 rounded-2xl border border-dashed p-6 text-center">The Dead-Letter Queue is empty. Nice!</div>}
        </div>
    );
};

export default Dlq;