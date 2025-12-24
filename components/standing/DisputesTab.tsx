
import React, { useState } from 'react';
import useSWR from 'swr';
import type { Dispute, DisputeKind } from '../../types';
import { getUserDisputes, createUserDispute } from '../../services/standingService';
import { useToasts } from '../ToastHost';

const DisputesTab: React.FC = () => {
    const { data: disputes, isLoading: loading, mutate } = useSWR<Dispute[]>('my-disputes', getUserDisputes);
    const [showForm, setShowForm] = useState(false);
    const [newDispute, setNewDispute] = useState({ kind: 'payout' as DisputeKind, ref: '', title: '', body: '' });
    const { add: addToast } = useToasts();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDispute.title) {
            addToast({ title: 'Title required', desc: 'Please provide a title for your dispute.', emoji: '📝' });
            return;
        }
        try {
            await createUserDispute(newDispute);
            addToast({ title: 'Dispute Filed', desc: 'Your dispute has been submitted for review.', emoji: '✅' });
            setShowForm(false);
            setNewDispute({ kind: 'payout', ref: '', title: '', body: '' });
            mutate(); // Refresh list
        } catch (err: any) {
            addToast({ title: 'Error', desc: err.message || 'Could not file dispute.', emoji: '😥' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">My Disputes</h3>
                <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-lg border text-sm">{showForm ? 'Cancel' : 'File a new dispute'}</button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-4 space-y-3">
                    {/* Simplified form for placeholder */}
                    <div>
                        <label className="text-sm font-medium">Title</label>
                        <input 
                            value={newDispute.title} 
                            onChange={e => setNewDispute({...newDispute, title: e.target.value})} 
                            className="w-full border rounded-xl px-3 py-2 mt-1" 
                            required 
                        />
                    </div>
                    <button type="submit" className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">Submit Dispute</button>
                </form>
            )}

            <div className="rounded-2xl border bg-white p-4 space-y-2">
                {loading && <p>Loading disputes...</p>}
                {!loading && disputes?.map(d => (
                    <div key={d.id} className="p-2 border-b">
                        <div className="font-medium">{d.title}</div>
                        <div className="text-xs text-gray-500">{d.kind} - {d.status} - {new Date(d.created_at).toLocaleDateString()}</div>
                    </div>
                ))}
                {!loading && disputes?.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No disputes found.</p>}
            </div>
        </div>
    );
};

export default DisputesTab;
