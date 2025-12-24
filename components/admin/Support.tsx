
import React, { useState, useEffect, useCallback } from 'react';
import type { SupportTicket, SupportTicketMessage, SupportTicketStatus, SupportTicketPriority } from '../../types';
import { useToasts } from '../ToastHost';
import { supabase } from '../../supabaseClient';
import { getAdminTickets, getTicketWithMessages, replyToTicket, updateTicket, summarizeTicketThreadWithAI, issueRefundForTicket, issueAdjustmentForTicket } from '../../services/supportService';

const statusOptions: SupportTicketStatus[] = ['open', 'pending', 'resolved', 'closed'];
const priorityOptions: SupportTicketPriority[] = ['low', 'normal', 'high', 'urgent'];

const statusColors: Record<SupportTicketStatus, string> = {
    open: 'bg-amber-100 text-amber-800 border-amber-200',
    pending: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const TicketDetailView: React.FC<{
    ticketId: number;
    onBack: () => void;
    onUpdate: () => void;
}> = ({ ticketId, onBack, onUpdate }) => {
    const [data, setData] = useState<{ ticket: SupportTicket, messages: SupportTicketMessage[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const { add: addToast } = useToasts();
    
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');

    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);


    const loadTicket = useCallback(async () => {
        setLoading(true);
        try {
            const ticketData = await getTicketWithMessages(ticketId);
            setData(ticketData);
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || "Could not load ticket details.", emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [ticketId, addToast]);

    useEffect(() => { loadTicket(); }, [loadTicket]);

    const handleReply = async () => {
        if (!reply.trim()) return;
        setIsReplying(true);
        try {
            const newMsg = await replyToTicket(ticketId, reply, 'admin-user', true);
            setData(d => d ? ({ ...d, messages: [...d.messages, newMsg] }) : null);
            setReply('');
            onUpdate(); // To refresh status in the list
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not send reply.', emoji: '😥' });
        } finally {
            setIsReplying(false);
        }
    };
    
    const handleUpdate = async (updates: { status?: SupportTicketStatus, priority?: SupportTicketPriority }) => {
        try {
            const updatedTicket = await updateTicket(ticketId, updates);
            setData(d => d ? ({ ...d, ticket: updatedTicket }) : null);
            addToast({ title: 'Ticket Updated', desc: 'Status/priority has been changed.', emoji: '✅' });
            onUpdate();
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not update ticket.', emoji: '😥' });
        }
    };

    const handleSummarize = async () => {
        if (!data || data.messages.length === 0) return;
        setIsSummarizing(true);
        setSummary('');
        try {
            const result = await summarizeTicketThreadWithAI(data.messages);
            setSummary(result);
        } catch (e: any) {
            addToast({ title: 'AI Error', desc: 'Could not generate summary.', emoji: '🤖' });
        } finally {
            setIsSummarizing(false);
        }
    };
    
    const handleIssueRefund = async () => {
        if (!data?.ticket.transaction_id) return;
        setIsActionSubmitting(true);
        try {
            await issueRefundForTicket({
                ticketId: data.ticket.id,
                transactionId: data.ticket.transaction_id,
                amount: refundAmount ? Number(refundAmount) : undefined,
                actorId: 'mock-admin-id' // In real app, get from session
            });
            addToast({ title: 'Refund Processed', desc: 'The refund has been issued and logged.', emoji: '💸' });
            setIsRefundModalOpen(false);
            setRefundAmount('');
            loadTicket();
            onUpdate();
        } catch (e: any) {
            addToast({ title: 'Refund Failed', desc: e.message, emoji: '😥' });
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleIssueAdjustment = async () => {
        if (!data?.ticket.pool_id || !data.ticket.user_id || !adjustmentAmount || !adjustmentReason) {
            addToast({ title: 'Missing Info', desc: 'Amount and reason are required for adjustments.', emoji: '📝' });
            return;
        }
        setIsActionSubmitting(true);
        try {
            await issueAdjustmentForTicket({
                ticketId: data.ticket.id,
                poolId: data.ticket.pool_id,
                userId: data.ticket.user_id,
                amount: Number(adjustmentAmount),
                reason: adjustmentReason,
                actorId: 'mock-admin-id' // In real app, get from session
            });
            addToast({ title: 'Adjustment Issued', desc: 'The adjustment has been processed and logged.', emoji: '✅' });
            setIsAdjustmentModalOpen(false);
            setAdjustmentAmount('');
            setAdjustmentReason('');
            loadTicket();
            onUpdate();
        } catch (e: any) {
            addToast({ title: 'Adjustment Failed', desc: e.message, emoji: '😥' });
        } finally {
            setIsActionSubmitting(false);
        }
    };


    if (loading) return <div className="p-4 text-center">Loading ticket...</div>;
    if (!data) return <div className="p-4 text-center">Ticket not found.</div>;

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="text-sm text-brand hover:underline">← Back to all tickets</button>
            <div className="rounded-2xl border bg-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold">{data.ticket.subject}</h3>
                        <p className="text-xs text-gray-500">User: {data.ticket.user_id} • Pool: {data.ticket.pool_id || 'N/A'} • Txn: {data.ticket.transaction_id || 'N/A'}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                        <select value={data.ticket.status} onChange={e => handleUpdate({ status: e.target.value as SupportTicketStatus })} className="w-full border rounded-lg px-2 py-1 bg-white">
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <select value={data.ticket.priority} onChange={e => handleUpdate({ priority: e.target.value as SupportTicketPriority })} className="w-full border rounded-lg px-2 py-1 bg-white">
                            {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
                    <button onClick={handleSummarize} disabled={isSummarizing} className="px-3 py-1.5 text-xs rounded-lg border bg-amber-50 text-amber-800 font-semibold disabled:opacity-50">
                        {isSummarizing ? 'Thinking...' : 'Summarize with AI'}
                    </button>
                     <button
                        onClick={() => setIsRefundModalOpen(true)}
                        disabled={!data.ticket.transaction_id}
                        title={!data.ticket.transaction_id ? "No transaction linked to this ticket" : "Issue a refund"}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Refund
                    </button>
                    <button
                        onClick={() => setIsAdjustmentModalOpen(true)}
                        disabled={!data.ticket.pool_id || !data.ticket.user_id}
                        title={(!data.ticket.pool_id || !data.ticket.user_id) ? "Ticket not linked to a user and pool" : "Issue a credit or charge"}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Adjust
                    </button>
                    {summary && <div className="mt-2 text-xs text-gray-700 bg-slate-50 p-2 rounded border prose w-full"><div dangerouslySetInnerHTML={{__html: summary.replace(/\n/g, '<br />')}} /></div>}
                </div>
            </div>
            
            <div className="rounded-2xl border bg-white p-4 space-y-3 h-96 overflow-y-auto">
                {data.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] ${msg.is_admin ? 'bg-brand text-white' : 'bg-slate-100'}`}>
                            <p className="text-sm">{msg.body}</p>
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-2">{msg.is_admin ? 'Support Team' : 'User'} • {new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
             <div className="rounded-2xl border bg-white p-4 space-y-2">
                 <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} className="w-full border rounded-xl p-2 text-sm" placeholder="Type your reply..."></textarea>
                 <button onClick={handleReply} disabled={isReplying} className="px-4 py-2 text-sm rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
                    {isReplying ? 'Sending...' : 'Send Reply'}
                 </button>
             </div>
             
             {isRefundModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
                  <h3 className="text-lg font-semibold">Issue Refund for Txn #{data.ticket.transaction_id}</h3>
                  <div>
                    <label className="text-sm font-medium">Amount (₦)</label>
                    <input 
                      type="number"
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      placeholder="Leave blank for full refund"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button onClick={() => setIsRefundModalOpen(false)} disabled={isActionSubmitting} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleIssueRefund} disabled={isActionSubmitting} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                      {isActionSubmitting ? 'Processing...' : 'Confirm Refund'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isAdjustmentModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
                  <h3 className="text-lg font-semibold">Issue Adjustment</h3>
                  <div>
                    <label className="text-sm font-medium">Amount (₦)</label>
                    <p className="text-xs text-gray-500">Positive for a credit to the user, negative for a charge/fee.</p>
                    <input 
                      type="number"
                      value={adjustmentAmount}
                      onChange={e => setAdjustmentAmount(e.target.value)}
                      placeholder="e.g., 5000 or -2500"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <input 
                      type="text"
                      value={adjustmentReason}
                      onChange={e => setAdjustmentReason(e.target.value)}
                      placeholder="e.g., Goodwill credit for inconvenience"
                      className="w-full mt-1 border rounded-xl px-3 py-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button onClick={() => setIsAdjustmentModalOpen(false)} disabled={isActionSubmitting} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleIssueAdjustment} disabled={isActionSubmitting} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                      {isActionSubmitting ? 'Processing...' : 'Confirm Adjustment'}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};


const AdminSupport: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'all'>('open');
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const { add: addToast } = useToasts();
    
    const loadTickets = useCallback(() => {
        setLoading(true);
        getAdminTickets(statusFilter)
            .then(setTickets)
            .catch(() => addToast({ title: 'Error', desc: 'Could not load support tickets.', emoji: '😥' }))
            .finally(() => setLoading(false));
    }, [addToast, statusFilter]);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    if (selectedTicketId) {
        return <TicketDetailView ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} onUpdate={loadTickets} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Support Queue</h3>
                <div className="flex items-center gap-2">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="border rounded-lg px-2 py-1 text-sm bg-white">
                        <option value="all">All</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="rounded-2xl border bg-white overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left border-b">
                        <tr>
                            <th className="p-3">Subject</th>
                            <th className="p-3">User</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Last Updated</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading tickets...</td></tr>}
                        {!loading && tickets.map(t => (
                            <tr key={t.id} className="border-b">
                                <td className="p-3 font-medium">{t.subject}</td>
                                <td className="p-3 font-mono text-xs">{t.user_id}</td>
                                <td className="p-3 capitalize">{t.priority}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[t.status]}`}>{t.status}</span>
                                </td>
                                <td className="p-3 text-xs">{new Date(t.updated_at).toLocaleString()}</td>
                                <td className="p-3">
                                    <button onClick={() => setSelectedTicketId(t.id)} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-100">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && tickets.length === 0 && <div className="text-center text-sm text-gray-500 py-6">No tickets match the current filter.</div>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSupport;
