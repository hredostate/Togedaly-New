
import { useState, useCallback } from 'react';
import { queueMutation } from '../lib/offlineQueue';
import { useToasts } from '../components/ToastHost';

export function useOfflineMutation() {
  const { add: addToast } = useToasts();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  window.addEventListener('online', () => setIsOffline(false));
  window.addEventListener('offline', () => setIsOffline(true));

  const mutate = useCallback(async (url: string, method: string, body: any, successMessage = 'Action completed') => {
    if (!navigator.onLine) {
        await queueMutation(url, method, body);
        addToast({ title: 'Offline: Action Queued', desc: 'Will sync when connection returns.', emoji: '📡' });
        return { ok: true, offline: true };
    }

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!res.ok) throw new Error('Request failed');
        
        const data = await res.json();
        addToast({ title: 'Success', desc: successMessage, emoji: '✅' });
        return { ok: true, data };
    } catch (e: any) {
        addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        return { ok: false, error: e };
    }
  }, [addToast]);

  return { mutate, isOffline };
}
