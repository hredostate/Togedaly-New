
'use client';
import React, { useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { getPhrase } from '../lib/phraseBank';

// Mock fetcher since useSWR and actual API routes are not available
const fetcher = async (url: string) => {
  console.log(`Mock fetching: ${url}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, the API would return data based on the user's stored preferences.
  // Here we return raw data that the component will adapt using the client-side phrase bank.
  return {
    id: 123,
    org_id: 1,
    user_id: 'mock-user-id',
    priority: 'high',
    category: 'pay',
    deeplink: "#", // Use '#' for placeholder deeplink
    created_at: new Date().toISOString()
  };
};

export default function NextBestActionCard({ orgId, userId }: { orgId: number; userId: string }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();
  const tone = settings.coach_tone || 'playful';

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await fetcher(`/api/coach/suggest?orgId=${orgId}&userId=${userId}`);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch suggestion", error);
        setData({ error: 'Failed to load' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [orgId, userId]);

  if (isLoading) return <Shell title={getPhrase('loading', tone)} />;
  if (!data || data.error) return <Shell title={getPhrase('no_advice', tone)} />;
  
  const s = data;
  
  // Map mock data category/priority to phrase bank entries
  // In a real app, the API would perform this logic or return localized strings directly.
  const title = getPhrase('arrears_title', tone);
  const body = getPhrase('arrears_body', tone);
  const cta = getPhrase('arrears_cta', tone);
  
  const speak = () => {
    if ('speechSynthesis' in window) {
      // Cancel any previous utterance
      speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(body);
      
      // Improved voice selection strategy
      const voices = speechSynthesis.getVoices();
      // Try to match based on the tone/locale
      // Note: 'en-NG' (Nigerian English) is not standard in all browsers, 
      // so we look for it but fallback gracefully.
      let chosenVoice = null;
      
      if (tone === 'playful') {
          // For playful tone, prefer a Nigerian voice if available, or just a generic English one
          chosenVoice = voices.find(v => v.lang.includes('NG') || v.name.includes('Nigeria'));
      } else {
          // For formal, prefer standard GB or US
          chosenVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en-US');
      }

      // If specific preference not found, just take the first English voice or default
      if (!chosenVoice) {
          chosenVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
      
      if (chosenVoice) u.voice = chosenVoice;

      if (tone === 'playful') {
          u.rate = 1.1; 
          u.pitch = 1.05; 
      } else {
          u.rate = 0.95;
          u.pitch = 1.0;
      }
      
      speechSynthesis.speak(u);
    } else {
        alert("Sorry, your browser doesn't support text-to-speech.");
    }
  };
  
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 grid gap-2 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{getPhrase('next_action_header', tone)}</div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-700">Priority: {s.priority} • {s.category}</div>
      <p className="text-sm text-gray-600 italic">"{body}"</p>
      <div className="flex gap-2 mt-2">
        <a href={s.deeplink || '#'} className="px-3 py-2 bg-black text-white rounded-xl text-sm font-semibold">{cta}</a>
        <button onClick={speak} className="px-3 py-2 border rounded-xl text-sm">{getPhrase('voice_label', tone)}</button>
      </div>
    </div>
  );
}

function Shell({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div className="rounded-2xl border bg-white p-4 text-sm text-gray-700">{title}{subtitle ? <div className="text-gray-500 mt-1">{subtitle}</div> : null}</div>;
}
