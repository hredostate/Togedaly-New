
import React from 'react';
import useSWR from 'swr';
import { getInboxMessages, markAllAsRead } from '../../services/notificationService';
import type { InboxMessage } from '../../types';

interface InboxWidgetProps {
    onClose: () => void;
}

const InboxWidget: React.FC<InboxWidgetProps> = ({ onClose }) => {
    const { data: items, isLoading: loading, mutate } = useSWR<InboxMessage[]>('inbox-messages', getInboxMessages, {
        refreshInterval: 5000, // Poll every 5 seconds
    });
    
    const handleMarkAllRead = async () => {
        await markAllAsRead();
        // Optimistically update local cache
        if (items) {
            const updatedItems = items.map(item => ({ ...item, read_at: new Date().toISOString() }));
            mutate(updatedItems, false);
        }
    };

    return (
        <div className="absolute top-0 right-0 z-50 w-full max-w-sm">
             <div className="rounded-2xl border bg-white shadow-xl animate-fade-in-up">
                <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Inbox</h3>
                    <div>
                        <button onClick={handleMarkAllRead} className="text-xs text-brand hover:underline">Mark all as read</button>
                        <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-700">&times;</button>
                    </div>
                </div>
                <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-sm text-gray-500 p-4">Loading messages...</div>
                    ) : (
                        <>
                            {items?.map(m => (
                                <div key={m.id} className={`p-2.5 rounded-lg border-l-4 ${!m.read_at ? 'border-brand bg-brand-50/50' : 'border-transparent bg-slate-50'}`}>
                                    <div className="text-sm font-medium text-gray-800">{m.title}</div>
                                    <div className="text-sm text-gray-600 whitespace-pre-wrap">{m.body}</div>
                                    <div className="text-xs text-gray-500 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                            {items?.length === 0 && <div className="text-sm text-gray-500 text-center p-6">Your inbox is empty.</div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InboxWidget;
