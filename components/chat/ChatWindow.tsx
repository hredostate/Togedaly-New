
// components/chat/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage } from '../../services/chatService';
import { subscribeToMessages } from '../../services/chatRealtime';
import { chatWithAI } from '../../services/geminiService';
import type { ChatThread, ChatMessage } from '../../types';
import { supabase } from '../../supabaseClient';

interface ChatWindowProps {
    thread: ChatThread;
    onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ thread, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const channelRef = useRef<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isAiThread = thread.created_by === 'trustpool_ai' || thread.title.includes('AI Coach');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => {
            setCurrentUser(user?.id || 'mock-user-id');
        });

        setLoading(true);
        getMessages(thread.id)
            .then(setMessages)
            .finally(() => setLoading(false));
            
        const channel = subscribeToMessages(thread.id, (newMsg) => {
            setMessages(current => {
                // Prevent duplicates
                if (current.find(m => m.id === newMsg.id)) return current;
                return [...current, newMsg];
            });
        });
        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [thread.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isAiThinking]);

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser) return;
        const textToSend = newMessage;
        setNewMessage('');
        setSending(true);
        
        try {
            // 1. Send User Message
            const sentMessage = await sendMessage(thread.id, textToSend, currentUser);
            if (!messages.find(m => m.id === sentMessage.id)) {
                 setMessages(current => [...current, sentMessage]);
            }

            // 2. If AI thread, trigger response
            if (isAiThread) {
                setIsAiThinking(true);
                // Simulate network/processing delay for realism if RAG is too fast (or fallback is instant)
                // await new Promise(r => setTimeout(r, 600)); 
                
                const aiResponse = await chatWithAI(currentUser, textToSend);
                
                const botMessage = await sendMessage(thread.id, aiResponse, 'trustpool_ai');
                if (!messages.find(m => m.id === botMessage.id)) {
                    setMessages(current => [...current, botMessage]);
                }
                setIsAiThinking(false);
            }

        } catch (e) {
            console.error("Failed to send message", e);
            setIsAiThinking(false);
        } finally {
            setSending(false);
        }
    };

    // Helper to format timestamp like "14:05"
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#e5ded8] relative">
            {/* Chat Header */}
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between rounded-t-2xl z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full grid place-items-center text-white text-sm font-bold ${isAiThread ? 'bg-gradient-to-br from-brand to-indigo-500' : 'bg-gray-400'}`}>
                            {isAiThread ? 'AI' : thread.title.charAt(0)}
                        </div>
                        <div>
                            <div className="font-semibold text-sm text-gray-800 leading-tight">{thread.title}</div>
                            <div className="text-[10px] text-green-600 font-medium">{isAiThinking ? 'typing...' : 'Online'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-100/50 backdrop-blur-sm">
                {loading && <div className="text-center text-xs text-gray-400 py-4">Loading conversation...</div>}
                
                {messages.map((msg, index) => {
                    const isMe = msg.sender === currentUser;
                    const isAi = msg.sender === 'trustpool_ai';
                    const showTail = index === messages.length - 1 || messages[index + 1]?.sender !== msg.sender;

                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`relative max-w-[85%] px-3 py-2 shadow-sm text-sm ${
                                isMe 
                                ? 'bg-brand-600 text-white rounded-l-lg rounded-br-lg' 
                                : 'bg-white text-gray-800 rounded-r-lg rounded-bl-lg'
                            } ${showTail ? (isMe ? 'rounded-tr-none' : 'rounded-tl-none') : 'rounded-lg'}`}>
                                
                                {/* Sender Name (only for AI/Group) */}
                                {isAi && <div className="text-[10px] font-bold text-brand-600 mb-0.5">Adviser T</div>}
                                
                                <div className="pr-6 pb-1 whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.body}
                                </div>

                                {/* Metadata Row */}
                                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                    <span className={`text-[9px] ${isMe ? 'text-brand-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.created_at)}
                                    </span>
                                    {isMe && (
                                        <span className="text-brand-200">
                                            {/* Double tick SVG */}
                                            <svg className="w-3 h-3" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.00004 6L4.50004 9.5L10.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.50004 6L9.00004 9.5L15 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isAiThinking && (
                    <div className="flex justify-start w-full">
                        <div className="bg-white px-4 py-3 rounded-r-xl rounded-bl-xl shadow-sm border border-gray-100 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 bg-white border-t rounded-b-2xl">
                <div className="flex items-end gap-2 bg-white p-1">
                    <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-brand focus-within:bg-white transition-all">
                        <input 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-transparent text-sm focus:outline-none max-h-24"
                            placeholder="Type a message..."
                            disabled={sending || isAiThinking}
                            autoFocus
                        />
                    </div>
                    <button 
                        onClick={handleSend} 
                        disabled={sending || isAiThinking || !newMessage.trim()} 
                        className={`p-3 rounded-full shadow-sm transition-all ${
                            !newMessage.trim() 
                            ? 'bg-gray-200 text-gray-400' 
                            : 'bg-brand-600 text-white hover:bg-brand-700 hover:scale-105'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
