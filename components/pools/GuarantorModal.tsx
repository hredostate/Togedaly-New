
import React, { useState } from 'react';
import { useToasts } from '../ToastHost';
import { inviteGuarantor } from '../../services/poolService';

interface GuarantorModalProps {
    poolId: string;
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
    acceptedCount: number;
}

const GuarantorModal: React.FC<GuarantorModalProps> = ({ poolId, userId, onClose, onSuccess, acceptedCount }) => {
    const [email, setEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const { add: addToast } = useToasts();

    const handleInvite = async () => {
        if (!email.includes('@')) {
            addToast({ title: 'Invalid Email', desc: 'Please enter a valid email.', emoji: '⚠️' });
            return;
        }
        setInviting(true);
        try {
            await inviteGuarantor(poolId, userId, email);
            addToast({ title: 'Invitation Sent', desc: `Request sent to ${email}.`, emoji: '📨' });
            setEmail('');
            // In a real app, we wait for a socket update.
            // Here we trigger success to refresh the parent view
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl border border-indigo-100">
                        🤝
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Guarantors Required</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        This is a high-value pool ({'>'}₦100k). To maintain trust, you need <strong>2 verified guarantors</strong> to vouch for you before joining.
                    </p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                    <div className={`h-2 flex-1 rounded-full ${acceptedCount >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                    <div className={`h-2 flex-1 rounded-full ${acceptedCount >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                </div>
                <div className="text-center text-xs font-semibold text-gray-600 mb-6">
                    {acceptedCount} / 2 Guarantors Accepted
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-700 ml-1">Invite a Guarantor</label>
                    <div className="flex gap-2">
                        <input 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                        />
                        <button 
                            onClick={handleInvite}
                            disabled={inviting || acceptedCount >= 2}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-200"
                        >
                            {inviting ? '...' : 'Invite'}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">
                        Mock Mode: Invites are auto-accepted after 2.5 seconds.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuarantorModal;
