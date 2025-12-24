import React from 'react';

export function ChannelChips({ channels }: { channels?: string[] }) {
  const ch = (channels && channels.length ? channels : ['toast']) as string[];
  const base = 'px-2 py-[3px] rounded-lg border text-[11px] font-medium';
  return (
    <div className="flex items-center gap-1">
      {ch.includes('toast') && <span className={`${base} bg-slate-100 border-slate-200 text-slate-700`}>Toast</span>}
      {ch.includes('sms') && <span className={`${base} bg-amber-100 border-amber-200 text-amber-800`}>SMS</span>}
      {ch.includes('email') && <span className={`${base} bg-emerald-100 border-emerald-200 text-emerald-800`}>Email</span>}
    </div>
  );
}

export default ChannelChips;