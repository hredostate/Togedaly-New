// components/chat/ThreadList.tsx
import React, { useState, useEffect } from 'react';
import { getThreads } from '../../services/chatService';
import type { ChatThread } from '../../types';

interface ThreadListProps {
    orgId: number;
    onOpen: (thread: ChatThread) => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({ orgId, onOpen }) => {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getThreads(orgId)
            .then(setThreads)
            .finally(() => setLoading(false));
    }, [orgId]);

    if (loading) {
        return <div className="p-4 text-center text-sm text-gray-500">Loading threads...</div>;
    }
    
    if (threads.length === 0) {
        return <div className="p-4 text-center text-sm text-gray-500">No chats yet.</div>;
    }

    return (
        <div className="space-y-1 p-2">
            {threads.map(thread => (
                <button 
                    key={thread.id} 
                    onClick={() => onOpen(thread)}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-100 transition"
                >
                    <div className="font-semibold text-sm">{thread.title}</div>
                    <div className="text-xs text-gray-500 truncate">{thread.last_message_preview}</div>
                </button>
            ))}
        </div>
    );
};
