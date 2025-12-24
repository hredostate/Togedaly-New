
import React, { useState } from 'react';
import useSWR from 'swr';
import { getWalletBalance } from '../../services/poolService';
import { StreakCounter } from '../gamify/StreakCounter';
import type { Page } from '../../App';

export const DashboardHeader: React.FC<{ user: any, setPage: (page: Page) => void }> = ({ user, setPage }) => {
    const { data: balanceKobo } = useSWR('wallet-balance', getWalletBalance);
    const [hideBalance, setHideBalance] = useState(false);

    const balance = (balanceKobo || 0) / 100;
    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Odogwu';

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-xl overflow-hidden">
                        {/* Placeholder Avatar */}
                        <span className="text-2xl">😎</span>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Welcome back,</div>
                        <h1 className="text-xl font-bold text-gray-900 leading-none">{name}</h1>
                    </div>
                </div>
                <StreakCounter />
            </div>

            <div className="relative z-10 p-4 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Balance</span>
                    <button onClick={() => setHideBalance(!hideBalance)} className="text-slate-400 hover:text-white transition">
                        {hideBalance ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                    </button>
                </div>
                <div className="text-3xl font-bold mb-4 font-mono tracking-tight">
                    {hideBalance ? '••••••••' : `₦${balance.toLocaleString()}`}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage('wallet')} className="flex-1 bg-white text-slate-900 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 transition active:scale-95">
                        Add Money
                    </button>
                    <button onClick={() => setPage('explore')} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold border border-slate-700 hover:bg-slate-700 transition active:scale-95">
                        Join Pool
                    </button>
                </div>
            </div>
        </div>
    );
};
