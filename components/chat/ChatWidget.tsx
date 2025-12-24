import React, { useState } from 'react';
import { ThreadList } from './ThreadList';
import { ChatWindow } from './ChatWindow';
import type { ChatThread } from '../../types';

const MOCK_ORG_ID = 1;

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeThread, setActiveThread] = useState<ChatThread | null>(null);

    const handleOpenThread = (thread: ChatThread) => {
        setActiveThread(thread);
    };
    
    const handleBack = () => {
        setActiveThread(null);
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-brand text-white grid place-items-center shadow-lg hover:bg-brand-700 transition-transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm h-[500px] flex flex-col rounded-2xl bg-white shadow-2xl border animate-fade-in-up">
            <div className="p-3 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="font-semibold text-gray-800">{activeThread ? 'Chat' : 'Chat Threads'}</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {activeThread ? (
                    <ChatWindow thread={activeThread} onBack={handleBack} />
                ) : (
                    <ThreadList orgId={MOCK_ORG_ID} onOpen={handleOpenThread} />
                )}
            </div>
        </div>
    );
};

export default ChatWidget;