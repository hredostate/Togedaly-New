
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { ChatMessage } from '../types';

export function useNudges(userId?: string){
  const [toast, setToast] = useState<ChatMessage | null>(null);
  useEffect(()=>{
    if (!userId) return;

    const channel = supabase
        .channel('nudges')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat_messages', 
                filter: `author=eq.trustpool_ai` 
            }, 
            (payload)=>{
                const msg:any = payload.new;
                // A more robust check would be to see if the user is a participant of the thread.
                // For now, we assume if we get the event, it's for the logged-in user for this demo.
                setToast(msg);
                setTimeout(()=>setToast(null), 12000);
            }
        ).subscribe();
        
    return ()=>{ supabase.removeChannel(channel); };
  }, [userId]);
  return { toast };
}
