
import React, { useEffect, useState } from 'react';
import { getKycProfile } from '../../services/kycService';
import type { KycProfile } from '../../types';
import type { Page } from '../../App';
import { supabase } from '../../supabaseClient';


interface KycStatusCardProps {
    setPage: (page: Page) => void;
}

const KycStatusCard: React.FC<KycStatusCardProps> = ({ setPage }) => {
  const [profile, setProfile] = useState<KycProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: v1 compatibility wrapper for getUser
    Promise.resolve().then(async () => {
        const auth = supabase.auth as any;
        const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
        return { data: { user } };
    }).then(({ data: { user } }) => {
        if (user) {
            getKycProfile(user.id).then(p => { // Use real user ID
              setProfile(p);
              setLoading(false);
            });
        } else {
            // For logged-out users, show a generic unverified status
            getKycProfile('mock-guest-id').then(p => {
                if (p) {
                    p.status = 'unverified';
                    setProfile(p);
                }
                setLoading(false);
            });
        }
    });
  }, []);

  if (loading) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
        </div>
    );
  }

  if (!profile) return null;

  const statusColors: Record<string, string> = {
      verified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      pending: 'text-amber-700 bg-amber-50 border-amber-200',
      rejected: 'text-rose-700 bg-rose-50 border-rose-200',
      unverified: 'text-slate-700 bg-slate-50 border-slate-200',
  }
  
  const isVerified = profile.status === 'verified';

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <div className="text-xl font-semibold">Identity Verification</div>
           <div className="text-sm text-gray-500 mt-1">
                Your account status is:
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusColors[profile.status] || statusColors.unverified}`}>
                    {profile.status.replace('_', ' ')}
                </span>
           </div>
        </div>
        {!isVerified && (
            <button onClick={() => setPage('kyc')} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-700 transition">
              {profile.status === 'unverified' ? 'Verify Now' : 'Complete Verification'}
            </button>
        )}
      </div>
      {profile.status === 'rejected' && (
        <div className="mt-2 text-sm text-rose-700 p-2 bg-rose-50 rounded-lg border border-rose-200">
            <strong>Reason:</strong> {profile.data?.reason || 'There was an issue with your submission.'} Please try again.
        </div>
      )}
    </div>
  );
};

export default KycStatusCard;
