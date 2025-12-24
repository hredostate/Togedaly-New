
import React, { useState, useEffect } from 'react';

const names = ["Chinedu", "Ngozi", "Yusuf", "Bola", "Emeka", "Tunde", "Zainab", "Kemi", "Segun", "Amarachi", "Ify", "Musa"];
const actions = ["bought 2 slots", "joined the pool", "secured 5 units", "just contributed", "paid ₦50k", "locked in 3 units"];

export const SocialProofTicker: React.FC = () => {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const cycle = () => {
      // Randomly generate activity
      const name = names[Math.floor(Math.random() * names.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setMsg(`${name} ${action}`);
      
      // Hide after 4s
      setTimeout(() => setMsg(null), 4000);
    };

    // Initial delay before first pop-up
    const timeout = setTimeout(cycle, 3000);
    
    // Random interval between 8s and 15s to feel organic
    const interval = setInterval(cycle, Math.random() * 7000 + 8000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  if (!msg) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 animate-fade-in-up pointer-events-none">
      <div className="bg-slate-900/90 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 ring-1 ring-white/10">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
        <span className="font-medium">{msg}</span>
      </div>
    </div>
  );
};
