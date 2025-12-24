// FIX: Provide full content for the file to resolve module not found errors.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { ReconRun, ReconItem } from '../../../types';
import { getReconItemsForRun, matchReconItem, resolveReconItem, createLedgerTxn } from '../../../services/reconService';
import { useToasts } from '../../ToastHost';

type ItemTab = 'psp' | 'ledger' | 'bank';

const ReconDetail: React.FC<{ run: ReconRun; onBack: () => void }> = ({ run, onBack }) => {
    const [items, setItems] = useState<ReconItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<ItemTab>('psp');
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [actionRunning, setActionRunning] = useState(false);
    const { add: addToast } = useToasts();
    
    const loadItems = useCallback(() => {
        setLoading(true);
        getReconItemsForRun(run.id)
            .then(setItems)
            .catch(() => addToast({ title: 'Error', desc: 'Could not load items for this run.', emoji: '😥' }))
            .finally(() => setLoading(false));
    }, [run.id, addToast]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const filteredItems = useMemo(() => items.filter(i => i.source === tab && i.status === 'pending'), [items, tab]);
    const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[Number(k)]).map(Number), [selected]);
    
    const toggleAll = () => {
        if (selectedIds.length === filteredItems.length) {
            setSelected({});
        } else {
            const newSelected: Record<number, boolean> = {};
            filteredItems.forEach(item => newSelected[item.id] = true);
            setSelected(newSelected);
        }
    };
    
    const handleBulkAction = async (action: 'match' | 'resolve' | 'create') => {
        if (selectedIds.length === 0 && action !== 'create') {
            addToast({ title: 'No items selected', desc: 'Please select items to perform this action.', emoji: '🤔'});
            return;
        }
        setActionRunning(true);
        try {
            if (action === 'match') {
                await Promise.all(selectedIds.map(id => matchReconItem(id)));
                addToast({ title: 'Success', desc: `${selectedIds.length} item(s) marked as matched.`, emoji: '✅'});
            } else if (action === 'resolve') {
                 await Promise.all(selectedIds.map(id => resolveReconItem(id)));
                 addToast({ title: 'Success', desc: `${selectedIds.length} item(s) marked as resolved.`, emoji: '✅'});
            } else if (action === 'create') {
                // This is a simplified action for demo
                await createLedgerTxn({ amount: 5000, ref: `manual-recon-${run.id}`, walletId: 'w-manual' });
                addToast({ title: 'Success', desc: `Mock ledger transaction created.`, emoji: '📝'});
            }
            setSelected({});
            loadItems(); // Refresh
        } catch (e: any) {
            addToast({ title: 'Action Failed', desc: e.message || 'An error occurred.', emoji: '😥' });
        } finally {
            setActionRunning(false);
        }
    };
    
    const TabButton: React.FC<{ id: ItemTab, children: React.ReactNode }> = ({ id, children }) => (
        <button onClick={() => setTab(id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-brand text-white' : 'hover:bg-brand-50'}`}>{children}</button>
    );

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="text-sm text-gray-600 hover:text-brand transition">← Back to Runs</button>
            <h2 className="text-xl font-semibold">Reconciliation Run #{run.id} <span className="text-base font-normal text-gray-500">({run.status})</span></h2>
            
            <div className="rounded-2xl border bg-white p-2 flex flex-wrap gap-2">
                <TabButton id="psp">PSP</TabButton>
                <TabButton id="ledger">Ledger</TabButton>
                <TabButton id="bank">Bank</TabButton>
            </div>

            <div className="rounded-2xl border bg-white p-3 flex flex-wrap gap-2 items-center text-sm">
                <span className="mr-4">Bulk Actions for {selectedIds.length} selected item(s):</span>
                <button onClick={() => handleBulkAction('match')} disabled={actionRunning || selectedIds.length === 0} className="px-3 py-2 rounded-xl border disabled:opacity-50">Mark Matched</button>
                <button onClick={() => handleBulkAction('resolve')} disabled={actionRunning || selectedIds.length === 0} className="px-3 py-2 rounded-xl border disabled:opacity-50">Mark Mismatched (Resolve)</button>
                <button onClick={() => handleBulkAction('create')} disabled={actionRunning} className="px-3 py-2 rounded-xl border disabled:opacity-50">Create Ledger Txn</button>
                <button onClick={() => { /* Mock CSV export */ addToast({ title: 'Info', desc: 'CSV export would start here.', emoji: '📄' })}} disabled={actionRunning} className="px-3 py-2 rounded-xl border disabled:opacity-50">Export CSV</button>
            </div>

            <div className="overflow-auto border rounded-xl bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="p-2"><input type="checkbox" onChange={toggleAll} checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length} /></th>
                        <th className="text-left p-2 font-semibold">ID</th>
                        <th className="text-left p-2 font-semibold">Ref</th>
                        <th className="text-left p-2 font-semibold">Amount</th>
                        <th className="text-left p-2 font-semibold">Currency</th>
                    </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>}
                        {!loading && filteredItems.map((item) => (
                            <tr key={item.id} className="odd:bg-gray-50 border-b">
                                <td className="p-2"><input type="checkbox" checked={!!selected[item.id]} onChange={() => setSelected(s => ({...s, [item.id]: !s[item.id]}))} /></td>
                                <td className="p-2">{item.id}</td>
                                <td className="p-2 font-mono text-xs">{item.external_ref}</td>
                                <td className="p-2">{(item.amount / 100).toLocaleString()}</td>
                                <td className="p-2">{item.currency}</td>
                            </tr>
                        ))}
                        {!loading && filteredItems.length === 0 && (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-500">No unmatched items for this source.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReconDetail;