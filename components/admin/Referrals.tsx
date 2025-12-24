
import React, { useState, useEffect, useCallback } from 'react';
import { getReferralCode, getReferralHistory, getSystemReferralCodes, upsertReferralCode } from '../../services/referralService';
import type { ReferralCode, Referral } from '../../types';
import { useToasts } from '../ToastHost';
import { ReferralWidget } from './ReferralWidget';
import { supabase } from '../../supabaseClient';

const MOCK_ORG_ID = 1;

const Referrals: React.FC = () => {
    const [viewMode, setViewMode] = useState<'view' | 'manage'>('view');
    const [code, setCode] = useState<ReferralCode | null>(null);
    const [history, setHistory] = useState<Referral[]>([]);
    const [systemCodes, setSystemCodes] = useState<ReferralCode[]>([]);
    const [loading, setLoading] = useState(true);
    const { add: addToast } = useToasts();
    const [actorId, setActorId] = useState<string | null>(null);
    
    // Form state for system codes
    const [newCode, setNewCode] = useState<Partial<ReferralCode>>({});

    useEffect(() => {
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => {
            if (user) setActorId(user.id);
        });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [codeData, historyData, sysCodes] = await Promise.all([
                getReferralCode(MOCK_ORG_ID),
                getReferralHistory(MOCK_ORG_ID),
                getSystemReferralCodes()
            ]);
            setCode(codeData);
            setHistory(historyData);
            setSystemCodes(sysCodes);
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not load referral data.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreateSystemCode = async () => {
        if (!newCode.code || !newCode.reward_value) return;
        try {
            await upsertReferralCode(newCode);
            addToast({ title: 'Code Created', desc: `${newCode.code} is active.`, emoji: '✅' });
            setNewCode({});
            loadData();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading referral program details...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Referral Program</h2>
                <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-medium">
                    <button onClick={() => setViewMode('view')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'view' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>My Referrals</button>
                    <button onClick={() => setViewMode('manage')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'manage' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>System Codes</button>
                </div>
            </div>
            
            {viewMode === 'view' ? (
                <>
                    {actorId && <ReferralWidget orgId={MOCK_ORG_ID} actorId={actorId} />}
                    <div className="rounded-2xl border bg-white p-6">
                        <h3 className="font-semibold text-lg">Your Referrals ({history.length}/{code?.max_uses || 'N/A'})</h3>
                        <div className="mt-2 space-y-2">
                            {history.map(ref => (
                                <div key={ref.id} className="p-3 rounded-lg border flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">Referred Org #{ref.referred_org_id}</div>
                                        <div className="text-xs text-gray-500">Referred on: {new Date(ref.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${ref.status === 'rewarded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{ref.status}</span>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-sm text-gray-500 text-center py-6">You haven't referred any organizations yet.</p>}
                        </div>
                    </div>
                </>
            ) : (
                <div className="rounded-2xl border bg-white p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Manage System-Wide Codes</h3>
                    <p className="text-sm text-gray-500">These codes can be used by any new organization during signup.</p>
                    
                    <div className="overflow-auto border rounded-xl">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left">
                                <tr><th className="p-3">Code</th><th className="p-3">Reward (₦)</th><th className="p-3">Uses</th><th className="p-3">Status</th></tr>
                            </thead>
                            <tbody>
                                {systemCodes.map(c => (
                                    <tr key={c.id} className="border-b">
                                        <td className="p-3 font-mono font-bold">{c.code}</td>
                                        <td className="p-3">{c.reward_value.toLocaleString()}</td>
                                        <td className="p-3">{c.used_count} / {c.max_uses}</td>
                                        <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50">
                                    <td className="p-2"><input placeholder="NEW-CODE" className="border rounded px-2 py-1 w-full uppercase" value={newCode.code || ''} onChange={e => setNewCode({...newCode, code: e.target.value.toUpperCase()})} /></td>
                                    <td className="p-2"><input type="number" placeholder="5000" className="border rounded px-2 py-1 w-full" value={newCode.reward_value || ''} onChange={e => setNewCode({...newCode, reward_value: Number(e.target.value)})} /></td>
                                    <td className="p-2"><input type="number" placeholder="Max uses" className="border rounded px-2 py-1 w-full" value={newCode.max_uses || ''} onChange={e => setNewCode({...newCode, max_uses: Number(e.target.value)})} /></td>
                                    <td className="p-2"><button onClick={handleCreateSystemCode} className="bg-slate-900 text-white px-3 py-1 rounded text-xs w-full">Create</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Referrals;
