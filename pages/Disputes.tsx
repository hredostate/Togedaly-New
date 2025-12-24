
import React, { useState, useEffect } from 'react';
import type { Page } from '../App';
import { getDisputes, createDispute } from '../services/disputeService';
import type { Dispute } from '../types';
import { useToasts } from '../components/ToastHost';

const Disputes: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { add: addToast } = useToasts();

    // Form State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [kind, setKind] = useState<'payout' | 'groupbuy' | 'ajo' | 'other'>('payout');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDisputes();
            setDisputes(data);
        } catch (e) {
            addToast({ title: 'Error', desc: 'Failed to load disputes', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await createDispute({ title, body, kind });
            addToast({ title: 'Submitted', desc: 'Dispute ticket created', emoji: '✅' });
            setTitle('');
            setBody('');
            loadData();
        } catch (e) {
            addToast({ title: 'Error', desc: 'Submission failed', emoji: '🚫' });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => setPage('standing')} className="text-sm text-gray-600 hover:text-brand transition">← Back to My Standing</button>
            
            <div className="grid md:grid-cols-2 gap-6">
                {/* List Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">My Dispute History</h2>
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-3">
                            {disputes.map(d => (
                                <div key={d.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            d.status === 'open' ? 'bg-amber-100 text-amber-800' :
                                            d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>{d.status}</span>
                                        <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800">{d.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{d.body}</p>
                                    <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex gap-4">
                                        <span>Type: {d.kind}</span>
                                        <span>ID: {d.id}</span>
                                    </div>
                                </div>
                            ))}
                            {disputes.length === 0 && (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-500">
                                    No disputes found. That's good!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Form Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit sticky top-24">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">File a New Dispute</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                            <select 
                                value={kind} 
                                onChange={e => setKind(e.target.value as any)}
                                className="w-full border rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-brand focus:border-brand"
                            >
                                <option value="payout">Payout Issue</option>
                                <option value="groupbuy">Group Buy Item</option>
                                <option value="ajo">Ajo Contribution</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Short summary"
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Explain what happened..."
                                rows={4}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isCreating}
                            className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition disabled:opacity-50"
                        >
                            {isCreating ? 'Submitting...' : 'Submit Dispute'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Disputes;
