
import React, { useState } from 'react';
import { useToasts } from '../ToastHost';

interface ShareModalProps {
    title: string;
    shareId: string;
    type: 'pool' | 'event' | 'group_buy';
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ title, shareId, type, onClose }) => {
    const { add: addToast } = useToasts();
    const [copied, setCopied] = useState(false);

    // Construct URL (In a real app, this would use the actual domain)
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}?share=${shareId}`;
    const shareCode = shareId.slice(0, 8).toUpperCase();

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        addToast({ title: 'Link Copied!', desc: 'Share it with your gees.', emoji: '🔗' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const textMap = {
            pool: `Omo, see this Ajo pool: "${title}". I just joined. Let's run am together! Code: *${shareCode}* \n\n${shareLink}`,
            event: `You are invited to "${title}"! 🎟️ Secure your ticket or spray cash here: ${shareLink}`,
            group_buy: `Guys, cheap deal alert! 🛍️ "${title}" group buy is active. Join let's split the cost: ${shareLink}`
        };
        
        const text = encodeURIComponent(textMap[type] || textMap.pool);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-6 text-white text-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl backdrop-blur-md">
                        🚀
                    </div>
                    <h3 className="text-xl font-bold">Share & Engage</h3>
                    <p className="text-slate-300 text-sm mt-1">Get others hooked on {title}</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Share Code Section */}
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Join Code</div>
                        <div className="text-3xl font-mono font-bold text-brand-600 tracking-wider bg-brand-50 py-2 rounded-xl border border-brand-100 border-dashed">
                            {shareCode}
                        </div>
                    </div>

                    {/* Link Section */}
                    <div className="flex gap-2">
                        <input 
                            readOnly 
                            value={shareLink} 
                            className="flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-sm text-gray-600 outline-none"
                        />
                        <button 
                            onClick={handleCopy}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    {/* Social Buttons */}
                    <button 
                        onClick={handleWhatsApp}
                        className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#128C7E] transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Share on WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};
