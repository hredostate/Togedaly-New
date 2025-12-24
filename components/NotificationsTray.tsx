
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationsTrayProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsTray: React.FC<NotificationsTrayProps> = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAllRead, isLoading } = useNotifications();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col"
                    >
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-lg text-gray-900">Notifications</h2>
                                <p className="text-xs text-gray-500">
                                    You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={markAllRead} 
                                    className="p-2 text-xs font-semibold text-brand hover:bg-brand-50 rounded-lg transition"
                                >
                                    Mark Read
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                            {isLoading && <div className="text-center py-8 text-gray-400">Loading updates...</div>}
                            
                            {!isLoading && notifications.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <span className="text-4xl mb-2">📭</span>
                                    <p className="text-sm">No notifications yet.</p>
                                </div>
                            )}

                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`p-3 rounded-xl border transition-all ${
                                        !n.read_at ? 'bg-white border-brand-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-80'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`text-sm font-semibold ${!n.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{n.body}</p>
                                    {!n.read_at && (
                                        <div className="mt-2 flex justify-start">
                                            <span className="inline-block w-2 h-2 rounded-full bg-brand-500"></span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationsTray;
