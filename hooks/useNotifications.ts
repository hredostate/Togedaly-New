
import useSWR from 'swr';
import { getInboxMessages, markAllAsRead } from '../services/notificationService';
import type { InboxMessage } from '../types';

export function useNotifications() {
    const { data, error, isLoading, mutate } = useSWR<InboxMessage[]>('notifications', getInboxMessages, {
        refreshInterval: 10000
    });

    const unreadCount = data?.filter(n => !n.read_at).length || 0;

    const markAllRead = async () => {
        if (!data) return;
        // Optimistic update
        mutate(data.map(n => ({ ...n, read_at: new Date().toISOString() })), false);
        await markAllAsRead();
        mutate();
    };

    return {
        notifications: data || [],
        unreadCount,
        isLoading,
        isError: error,
        markAllRead,
        mutate
    };
}
