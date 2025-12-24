
import React, { useEffect, useState, useCallback } from 'react';
import { getAdminActionRequests, approveAdminActionRequest, rejectAdminActionRequest } from '../../services/adminService';
import type { AdminActionRequest } from '../../types';
import { useToasts } from '../ToastHost';
import { supabase } from '../../supabaseClient';

const Approvals: React.FC = () => {
    const [requests, setRequests] = useState<AdminActionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { add: addToast } = useToasts();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id || 'mock-admin-id'));
    }, []);

    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminActionRequests(1); // Mock Org ID 1
            setRequests(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load pending approvals.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleApprove = async (req: AdminActionRequest) => {
        if (req.requested_by === userId) {
            addToast({ title: 'Cannot Approve', desc: 'You cannot approve your own request.', emoji: '🚫' });
            return;
        }
        if (!confirm('Are you sure you want to approve this change?')) return;

        setProcessingId(req.id);
        try {
            await approveAdminActionRequest(req.id, userId!);
            addToast({ title: 'Approved', desc: 'Request approved and changes applied.', emoji: '✅' });
            loadRequests();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (req: AdminActionRequest) => {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;

        setProcessingId(req.id);
        try {
            await rejectAdminActionRequest(req.id, reason, userId!);
            addToast({ title: 'Rejected', desc: 'Request has been rejected.', emoji: '🚫' });
            loadRequests();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setProcessingId(null);
        }
    };

    const renderPayloadDiff = (payload: any) => {
        return (
            <div className="bg-slate-50 p-2 rounded-lg border text-xs font-mono overflow-auto max-h-32">
                {Object.entries(payload).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                        <span className="text-gray-500">{key}:</span>
                        <span className="font-semibold text-slate-700">{String(val)}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading pending approvals...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Pending Approvals</h3>
                <button onClick={loadRequests} className="text-sm text-brand hover:underline">Refresh</button>
            </div>

            {requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
                    No pending requests. All clear!
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-semibold text-gray-800 text-lg capitalize">
                                        {req.action_type.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Req #{req.id} by <span className="font-medium text-gray-700">{req.requested_by}</span> • {new Date(req.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium uppercase">
                                    {req.status}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs font-semibold text-gray-500 mb-1">PROPOSED CHANGES</div>
                                {renderPayloadDiff(req.payload)}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button 
                                    onClick={() => handleReject(req)}
                                    disabled={processingId === req.id}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                                <button 
                                    onClick={() => handleApprove(req)}
                                    disabled={processingId === req.id || req.requested_by === userId}
                                    title={req.requested_by === userId ? "You cannot approve your own request" : ""}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingId === req.id ? 'Processing...' : 'Approve'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Approvals;
