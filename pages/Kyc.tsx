
'use client';
import React, { useState, useEffect } from 'react';
import type { Page } from '../App';
import { useToasts } from '../components/ToastHost';
import { supabase } from '../supabaseClient';
import { submitKyc } from '../services/kycService';

const Kyc: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const [provider, setProvider] = useState<'smileid'|'verifyme'>('smileid');
  const [form, setForm] = useState({ nin:'', bvn:'', selfie:'', kinName: '', kinPhone: '', kinRelation: '' });
  const [submitting, setSubmitting] = useState(false);
  const { add: addToast } = useToasts();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(async () => {
        const auth = supabase.auth as any;
        const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
        return { data: { user } };
    }).then(({ data: { user } }) => {
        if (user) {
            setUserId(user.id);
        } else {
            addToast({ title: 'Not authenticated', desc: 'Please sign in to complete KYC.', emoji: '🔒'});
            setPage('auth');
        }
    });
  }, [addToast, setPage]);

  async function submit(){
    if (!userId) {
        addToast({ title: 'Error', desc: 'Could not identify user.', emoji: '😥'});
        return;
    }
    if (!form.nin && !form.bvn) {
        addToast({ title: 'Information Required', desc: 'Please provide either a BVN or NIN.', emoji: '📝'});
        return;
    }

    setSubmitting(true);
    try {
        await submitKyc(userId, form);
        addToast({ title: 'Verified!', desc: 'Your identity has been verified successfully.', emoji: '✅' });
        setPage('dashboard');
    } catch (e: any) {
        addToast({ title: 'Submission Failed', desc: e.message || 'An unexpected error occurred.', emoji: '😥' });
    } finally {
        setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
        <button onClick={() => setPage('dashboard')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Dashboard</button>
        <div className="max-w-xl mx-auto p-4 space-y-4">
            <div className="text-xl font-semibold">Verify your identity</div>
            <div className="rounded-2xl p-6 bg-white border space-y-4 shadow-sm">
                <p className="text-sm text-gray-600">Provide your BVN/NIN and a quick selfie liveness check to unlock all features and secure your account.</p>
                
                <div>
                    <label className="text-sm font-medium">Verification Provider</label>
                    <select className="w-full mt-1 border p-2 rounded-xl bg-white" value={provider} onChange={e=>setProvider(e.target.value as any)}>
                        <option value="smileid">SmileID (Recommended)</option>
                        <option value="verifyme">VerifyMe</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">BVN (Bank Verification Number)</label>
                        <input className="w-full mt-1 border p-2 rounded-xl" placeholder="11-digit BVN" onChange={e=>setForm(f=>({...f, bvn:e.target.value}))} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">NIN (National Identification Number)</label>
                        <input className="w-full mt-1 border p-2 rounded-xl" placeholder="11-digit NIN" onChange={e=>setForm(f=>({...f, nin:e.target.value}))} />
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <h4 className="text-sm font-semibold mb-2">Next of Kin</h4>
                    <p className="text-xs text-gray-500 mb-3">Required for account recovery and emergency contact.</p>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded-xl" placeholder="Full Name" onChange={e=>setForm(f=>({...f, kinName:e.target.value}))} />
                        <div className="grid grid-cols-2 gap-4">
                            <input className="w-full border p-2 rounded-xl" placeholder="Phone Number" onChange={e=>setForm(f=>({...f, kinPhone:e.target.value}))} />
                            <input className="w-full border p-2 rounded-xl" placeholder="Relationship (e.g. Sister)" onChange={e=>setForm(f=>({...f, kinRelation:e.target.value}))} />
                        </div>
                    </div>
                </div>

                 <div>
                    <label className="text-sm font-medium">Selfie Liveness Check</label>
                    <div className="mt-1 flex items-center justify-center border-2 border-dashed rounded-xl p-6 text-center text-gray-500 hover:bg-slate-50 cursor-pointer transition">
                        Tap to take selfie 📸
                    </div>
                </div>

                <button onClick={submit} disabled={submitting} className="w-full px-4 py-3 rounded-xl bg-brand text-white font-semibold disabled:opacity-50 shadow-lg shadow-brand/20 hover:bg-brand-700 transition">
                    {submitting ? 'Verifying...' : 'Submit Verification'}
                </button>
            </div>
        </div>
    </div>
  );
}

export default Kyc;
