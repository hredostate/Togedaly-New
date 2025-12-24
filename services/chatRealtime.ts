
// services/chatRealtime.ts
import { supabase } from '../supabaseClient';

export function subscribeToMessages(threadId: number, onNew: (msg: any) => void) {
  return supabase
    .channel('room:' + threadId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` }, (payload) => onNew(payload.new))
    .subscribe();
}
