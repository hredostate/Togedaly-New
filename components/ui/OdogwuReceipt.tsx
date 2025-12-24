
import React from 'react';

interface OdogwuReceiptProps {
    type: 'deposit' | 'contribution' | 'milestone';
    amount: number;
    title: string;
    userName: string;
    date: string;
    onClose: () => void;
}

export const OdogwuReceipt: React.FC<OdogwuReceiptProps> = ({ type, amount, title, userName, date, onClose }) => {
    const shareText = encodeURIComponent(
        `🦅 *ODOGWU STATUS CONFIRMED*\n\n` +
        `I just moved ₦${amount.toLocaleString()} for "${title}" on Togedaly.\n` +
        `No stories, just results. 🚀\n\n` +
        `Join the winning team here: https://togedaly.com`
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-sm transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                
                {/* The Premium Card */}
                <div className="relative overflow-hidden bg-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl text-white">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

                    {/* Content */}
                    <div className="relative z-10 p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 mb-4">
                            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                                <span className="text-3xl">🦁</span>
                            </div>
                        </div>

                        <div className="space-y-1 mb-6">
                            <h2 className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase">Transaction Certified</h2>
                            <h1 className="text-3xl font-black tracking-tight text-white">
                                ₦{amount.toLocaleString()}
                            </h1>
                            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-medium text-slate-300 border border-white/10 mt-2">
                                {title}
                            </div>
                        </div>

                        {/* Receipt Details */}
                        <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-transparent"></div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Odogwu:</span>
                                <span className="font-semibold text-slate-200">{userName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Date:</span>
                                <span className="font-mono text-slate-300">{date}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Type:</span>
                                <span className="font-semibold text-emerald-400 capitalize">{type}</span>
                            </div>
                        </div>

                        {/* Verified Seal */}
                        <div className="flex items-center gap-2 opacity-50 mb-6">
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            <span className="text-[10px] uppercase tracking-widest font-bold">Verified by Togedaly</span>
                        </div>

                        {/* Actions */}
                        <button 
                            onClick={() => window.open(`https://wa.me/?text=${shareText}`, '_blank')}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Flex on Status
                        </button>
                        <button onClick={onClose} className="mt-4 text-xs text-slate-500 hover:text-white transition">Close Receipt</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
