
import React, { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { SupportTicket, SupportTicketMessage } from '../../types';
import { useToasts } from '../ToastHost';
import { supabase } from '../../supabaseClient';
import { getUserTickets, getTicketWithMessages, createTicket, replyToTicket } from '../../services/supportService';

const statusColors: Record<SupportTicket['status'], string> = {
    open: 'bg-amber-100 text-amber-800 border-amber-200',
    pending: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const TicketDetailView: React.FC<{
    ticketId: number;
    onBack: () => void;
    userId: string;
}> = ({ ticketId, onBack, userId }) => {
    const { data, isLoading: loading, mutate } = useSWR(['ticket-detail', ticketId], () => getTicketWithMessages(ticketId));
    const [reply, setReply] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const { add: addToast } = useToasts();

    const handleReply = async () => {
        if (!reply.trim()) return;
        setIsReplying(true);
        try {
            const newMsg = await replyToTicket(ticketId, reply, userId, false);
            await mutate();
            setReply('');
        } catch(e: any) {
            addToast({ title: 'Error', desc: 'Could not send reply.', emoji: '😥' });
        } finally {
            setIsReplying(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading ticket...</div>;
    if (!data) return <div className="p-4 text-center">Ticket not found.</div>;

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="text-sm text-brand hover:underline">← Back to all tickets</button>
            <div className="rounded-2xl border bg-white p-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{data.ticket.subject}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[data.ticket.status]}`}>{data.ticket.status}</span>
                </div>
                <p className="text-xs text-gray-500">Last updated: {new Date(data.ticket.updated_at).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border bg-white p-4 space-y-3 h-96 overflow-y-auto">
                {data.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.is_admin ? 'items-start' : 'items-end'}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] ${msg.is_admin ? 'bg-slate-100' : 'bg-brand text-white'}`}>
                            <p className="text-sm">{msg.body}</p>
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-2">{msg.is_admin ? 'Support Team' : 'You'} • {new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
             <div className="rounded-2xl border bg-white p-4 space-y-2">
                 <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} className="w-full border rounded-xl p-2 text-sm" placeholder="Type your reply..."></textarea>
                 <button onClick={handleReply} disabled={isReplying} className="px-4 py-2 text-sm rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
                    {isReplying ? 'Sending...' : 'Send Reply'}
                 </button>
             </div>
        </div>
    );
};


const SupportTab: React.FC = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const { data: tickets, isLoading: loading, mutate } = useSWR(userId ? 'my-tickets' : null, getUserTickets);
    
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const { add: addToast } = useToasts();
    
    useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id || 'mock-user-id'));
    }, []);

    const handleCreate = async () => {
        if (!subject.trim() || !body.trim() || !userId) {
            addToast({ title: 'Missing Info', desc: 'Please fill out both subject and message.', emoji: '📝' });
            return;
        }
        setIsCreating(true);
        try {
            const newTicket = await createTicket(subject, body, userId);
            addToast({ title: 'Ticket Created', desc: 'Our team will get back to you shortly.', emoji: '✅' });
            setShowForm(false);
            setSubject('');
            setBody('');
            await mutate(); // Refresh list
            setSelectedTicketId(newTicket.id);
        } catch(e: any) {
             addToast({ title: 'Error', desc: e.message || 'Could not create ticket.', emoji: '😥' });
        } finally {
            setIsCreating(false);
        }
    };
    
    if (selectedTicketId && userId) {
        return <TicketDetailView ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} userId={userId} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">My Support Tickets</h3>
                <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-lg border text-sm font-semibold">{showForm ? 'Cancel' : 'Create New Ticket'}</button>
            </div>
            {showForm && (
                <div className="rounded-2xl border bg-white p-4 space-y-3">
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border rounded-xl p-2 text-sm" placeholder="Subject" />
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full border rounded-xl p-2 text-sm" placeholder="Describe your issue..."></textarea>
                    <button onClick={handleCreate} disabled={isCreating} className="px-4 py-2 text-sm rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
                        {isCreating ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </div>
            )}
            <div className="rounded-2xl border bg-white p-4 space-y-2">
                {loading && <div className="text-center p-4">Loading tickets...</div>}
                {!loading && tickets?.map(t => (
                    <button key={t.id} onClick={() => setSelectedTicketId(t.id)} className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-800">{t.subject}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[t.status]}`}>{t.status}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Last update: {new Date(t.updated_at).toLocaleString()}</div>
                    </button>
                ))}
                {!loading && tickets?.length === 0 && <div className="text-center text-sm text-gray-500 py-6">You have no support tickets.</div>}
            </div>
        </div>
    );
};

export default SupportTab;
