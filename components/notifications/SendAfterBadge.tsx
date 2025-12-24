import React from 'react';

export function SendAfterBadge({ ts }: { ts?: string | null }) {
  if (!ts) return null;
  
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;

    const isPast = d.getTime() <= Date.now();
    const label = isPast ? 'Send window open' : `Sends after ${d.toLocaleTimeString()}`;
    
    return (
      <span className={`px-2 py-[3px] rounded-lg border text-[11px] font-medium ${isPast ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
        {label}
      </span>
    );
  } catch (e) {
    return null;
  }
}

export default SendAfterBadge;