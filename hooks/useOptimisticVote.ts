import { useState, useCallback } from 'react';
import { useToasts } from '../components/ToastHost';
import { getNaijaToast } from '../services/geminiService';

export function useOptimisticVote(initialPct: number) {
  const [pct, setPct] = useState(initialPct);
  const [isVoting, setIsVoting] = useState(false);
  const { add } = useToasts();

  const vote = useCallback(async (
    doVote: () => Promise<{ yes_pct: number; accepted: boolean }>,
    v: 'yes' | 'no'
  ) => {
      if (isVoting) return;
      setIsVoting(true);
      const snapshot = pct;
      // Fake optimistic nudge - makes the UI feel responsive
      setPct((p) => Math.min(100, Math.max(0, v === 'yes' ? p + 5 : p - 3)));
      try {
        const res = await doVote();
        setPct(res.yes_pct); // Reconcile with server state
        const toast = await getNaijaToast('VOTE_CAST', `You voted ${v.toUpperCase()}`);
        add({ ...toast, desc: `Yes votes now at ${res.yes_pct}%. Your voice matters!` });
      } catch(e: any) {
        setPct(snapshot); // Rollback
        const toast = await getNaijaToast('GENERIC_ERROR');
        add({ ...toast, desc: e.message || toast.desc });
      } finally {
        setIsVoting(false);
      }
  }, [add, pct, isVoting]);
  
  return { pct, vote, isVoting };
}