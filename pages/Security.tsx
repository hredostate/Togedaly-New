
import React, { useState, useEffect } from 'react';
import type { Page } from '../App';
import DeviceTracker from '../components/security/DeviceTracker';
import { useKyc } from '../hooks/useKyc';
import { supabase } from '../supabaseClient';

const Security: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [userId, setUserId] = useState<string | undefined>();
  const { status } = useKyc(userId);

  useEffect(() => {
      Promise.resolve().then(async () => {
          const auth = supabase.auth as any;
          const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
          if (user) setUserId(user.id);
      });
  }, []);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={() => setPage('dashboard')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Dashboard</button>
      <h2 className="text-2xl font-semibold">Security & Privacy</h2>
      
      {/* Identity Verification Card */}
      <div className="rounded-2xl border border-brand-100 bg-white p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-brand-50 text-brand">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Identity Verification</h3>
            </div>
            <p className="text-sm text-gray-500">Current Status: <span className={`font-medium capitalize ${status === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</span></p>
        </div>
        <button 
            onClick={() => setPage('kyc')} 
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-md shadow-slate-200"
        >
            {status === 'verified' ? 'View Details' : 'Start Verification'}
        </button>
      </div>

      <DeviceTracker />

      <div className="rounded-2xl border border-brand-100 bg-white p-6">
        <h3 className="font-semibold text-lg">Account Actions</h3>
        <div className="mt-2 space-y-2">
            <button className="block text-left text-rose-600 hover:text-rose-800 text-sm font-medium py-1">
                Sign out from all other devices
            </button>
             <button className="block text-left text-rose-600 hover:text-rose-800 text-sm font-medium py-1">
                Delete my account
            </button>
        </div>
      </div>
    </div>
  );
};

export default Security;
