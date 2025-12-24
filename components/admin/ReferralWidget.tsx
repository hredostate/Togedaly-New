
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getOrgReferralCode, createOrgReferralCode } from '../../services/referralService';
import type { ReferralCode } from '../../types';
import { useToasts } from '../ToastHost';

interface ReferralWidgetProps {
  orgId: number;
  actorId: string | null;
}

export const ReferralWidget: React.FC<ReferralWidgetProps> = ({ orgId, actorId }) => {
  const [codeData, setCodeData] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { add: addToast } = useToasts();

  const loadCode = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrgReferralCode(orgId);
      setCodeData(data);
    } catch (e: any) {
      addToast({ title: 'Error', desc: e.message || 'Could not load referral code.', emoji: '😥' });
    } finally {
      setLoading(false);
    }
  }, [orgId, addToast]);
  
  useEffect(() => { loadCode() }, [loadCode]);

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://app.togedaly.com'; // fallback

  const code = codeData?.code;
  const shareLink = code ? `${baseUrl}/auth?ref=${encodeURIComponent(code)}` : '';

  async function handleCreateCode() {
    if (!actorId) {
        addToast({ title: 'Error', desc: 'Cannot create code without an authenticated user.', emoji: '🔒'});
        return;
    }
    setCreating(true);
    try {
      await createOrgReferralCode(orgId, actorId);
      await loadCode();
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      addToast({ title: 'Copied!', desc: 'Share link copied to clipboard.', emoji: '📋' });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      addToast({ title: 'Copy Failed', desc: 'Could not copy link.', emoji: '😥' });
    }
  }

  function whatsappShareText() {
    if (!shareLink || !code) return '';
    return encodeURIComponent(
      `Hi, I’m using Togedaly for community savings & group-buys. Use my referral code *${code}* when you sign up and we can both get rewards: ${shareLink}`
    );
  }

  if (loading) {
    return (
        <div className="rounded-2xl border bg-white p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-full"></div>
            <div className="h-10 bg-slate-200 rounded-xl mt-4"></div>
        </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Share Your Referral Code</h2>
        <p className="text-sm text-gray-500 mt-1">
          Share your code with other co-ops or businesses. When they pay their first invoice, you'll get credit.
        </p>
      </div>

      {!code && (
        <button
          disabled={creating}
          onClick={handleCreateCode}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold self-start"
        >
          {creating ? 'Creating…' : 'Generate Referral Code'}
        </button>
      )}

      {codeData && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Your Code:</span>
            <span className="text-lg font-mono bg-slate-100 rounded-lg px-3 py-1 border">{codeData.code}</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                readOnly
                value={shareLink}
                className="flex-1 border rounded-xl px-3 py-2 text-sm bg-slate-50"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 rounded-xl border text-sm font-semibold bg-white hover:bg-slate-100 min-w-[80px]"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex gap-2 flex-wrap text-sm">
              <a
                href={`https://wa.me/?text=${whatsappShareText()}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
              >
                Share on WhatsApp
              </a>
            </div>

            <p className="text-xs text-gray-600">
              Reward: ₦{(codeData.reward_value ?? 5000).toLocaleString()} credit when a referred org pays their first invoice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralWidget;