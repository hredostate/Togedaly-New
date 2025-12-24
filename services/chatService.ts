
import { supabase } from '../supabaseClient';
import type { ChatThread, ChatMessage } from '../types';

export async function getThreads(orgId: number, userId?: string): Promise<ChatThread[]> {
    // RLS policies on Supabase will handle the filtering by userId/orgId automatically
    const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('org_id', orgId)
        .order('last_message_at', { ascending: false });

    if (error) {
        console.warn("Chat threads fetch failed, using mock.", error);
        return []; 
    }
    
    return data as ChatThread[];
}

export async function getMessages(threadId: number): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', threadId) // Mapping: thread_id in DB, room_id in types (inconsistent naming in legacy types)
        .order('created_at', { ascending: true });

    if (error) {
        // Fallback for thread_id column name if room_id doesn't exist
        const { data: fallbackData } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });
            
        return (fallbackData || []) as ChatMessage[];
    }

    return (data || []) as ChatMessage[];
}

export async function sendMessage(threadId: number, body: string, author: string): Promise<ChatMessage> {
    const newMessage = {
        thread_id: threadId, // DB column
        room_id: threadId,   // Type expectation
        sender: author,
        body,
        org_id: 1, // Default or fetch context
        created_at: new Date().toISOString(),
        status: 'ok',
        meta: {}
    };

    const { data, error } = await supabase
        .from('chat_messages')
        .insert(newMessage)
        .select()
        .single();

    if (error) {
        console.error("Send message failed:", error);
        // Optimistic return for UI responsiveness if DB fails (though DB failure usually means offline)
        return { ...newMessage, id: Date.now(), strikes: 0 } as ChatMessage;
    }

    // Update thread timestamp
    await supabase.from('chat_threads').update({
        last_message_at: newMessage.created_at,
        last_message_preview: body.slice(0, 50)
    }).eq('id', threadId);

    return data as ChatMessage;
}
