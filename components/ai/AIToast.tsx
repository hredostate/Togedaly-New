
'use client';
import React, { useEffect } from 'react';
import { useSettings } from '../SettingsContext';

export function AIToast({ msg }:{ msg:any }){
  const { settings } = useSettings();
  const isScreenReader = settings.screen_reader_mode;

  useEffect(()=>{},[msg]);
  
  return (
    <div 
        className="fixed bottom-4 right-4 p-4 rounded-2xl shadow bg-white max-w-sm border border-brand-100 animate-fade-in-up"
        role={isScreenReader ? "alert" : undefined}
        aria-live={isScreenReader ? "assertive" : undefined}
    >
      <div className="font-semibold mb-1">{msg?.meta?.title || 'TrustPool AI'}</div>
      <div className="text-sm opacity-80 whitespace-pre-wrap">{msg?.body}</div>
      <div className="mt-2 flex gap-2 flex-wrap">
        {(msg?.meta?.ctas||[]).map((c:any,i:number)=> (
          <button key={i} className="px-3 py-1 rounded-xl border text-sm hover:bg-slate-100" onClick={()=>window.dispatchEvent(new CustomEvent('ai-cta',{ detail:c }))}>{c.label}</button>
        ))}
      </div>
    </div>
  );
}

export default AIToast;
