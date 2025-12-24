import { useState, useCallback } from 'react';
import { useToasts } from '../components/ToastHost';
import { getNaijaToast } from '../services/geminiService';

export function useOptimisticJoin(initialRaised: number) {
  const [raised, setRaised] = useState(initialRaised);
  const [isJoining, setIsJoining] = useState(false);
  const { add } = useToasts();
  
  const join = useCallback(async (
    doJoin: () => Promise<any>,
    amount: number
  ) => {
      if (isJoining) return;
      setIsJoining(true);
      const snapshot = raised;
      setRaised((r) => r + amount); // Optimistic update
      try {
        await doJoin();
        const toast = await getNaijaToast('JOIN_SUCCESS', `Amount: ₦${amount.toLocaleString()}`);
        add(toast);
      } catch(e: any) {
        setRaised(snapshot); // Rollback
        const toast = await getNaijaToast('GENERIC_ERROR');
        add({ ...toast, desc: e.message || toast.desc });
      } finally {
        setIsJoining(false);
      }
  }, [add, raised, isJoining]);

  return { raised, join, isJoining };
}