import React, { useEffect, useState, useCallback } from 'react';
import { getKycQueue, reviewKycDocument } from '../../services/adminService';
import type { KycDocument, KycLevel } from '../../types';
import { useToasts } from '../ToastHost';

const KycQueue: React.FC = () => {
    const [docs, setDocs] = useState<KycDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const { add: addToast } = useToasts();

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getKycQueue();
            setDocs(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not fetch KYC queue.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);
    
    const handleReview = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const docId = formData.get('doc_id') as string;
        const approve = formData.get('approve') === '1';
        const level = formData.get('level') as KycLevel;
        const reason = formData.get('reason') as string;
        
        if (!docId) return;
        setSubmitting(docId);
        try {
            await reviewKycDocument(docId, approve, approve ? level : null, reason);
            addToast({ title: 'Success', desc: `Document ${approve ? 'approved' : 'rejected'}.`, emoji: '✅' });
            fetchQueue(); // Refresh the list
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) return <div className="text-center p-4">Loading KYC queue...</div>;

    return (
        <div className="space-y-3">
            <h2 className="font-semibold text-lg">Pending KYC Documents</h2>
            {docs.map(d => (
                <div key={d.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <div className="flex justify-between text-sm">
                        <div className="font-medium">{d.doc_type} for user {d.user_id.slice(0, 8)}...</div>
                        <div className="text-gray-500">{new Date(d.created_at).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 text-sm">
                        <a className="text-brand underline" href={`#`} target="_blank" rel="noopener noreferrer">View Document</a>
                    </div>
                    <form onSubmit={handleReview} className="mt-3 flex flex-wrap gap-2 items-center">
                        <input type="hidden" name="doc_id" value={d.id} />
                        <select name="level" defaultValue="basic" className="border rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-brand focus:border-brand">
                            <option value="basic">Set to: Basic</option>
                            <option value="plus">Set to: Plus</option>
                            <option value="pro">Set to: Pro</option>
                        </select>
                        <input name="reason" placeholder="Optional note..." className="flex-grow border rounded-lg px-2 py-1.5 text-sm focus:ring-brand focus:border-brand" />
                        <button name="approve" value="1" disabled={submitting === d.id} className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50">Approve</button>
                        <button name="approve" value="0" disabled={submitting === d.id} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-slate-100 disabled:opacity-50">Reject</button>
                    </form>
                </div>
            ))}
            {!docs?.length && <div className="text-gray-500 rounded-2xl border border-dashed p-6 text-center">No pending documents. Good job!</div>}
        </div>
    );
};

export default KycQueue;