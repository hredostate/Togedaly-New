
import React from 'react';
import type { Page } from '../../App';

interface Feature {
  id: string;
  title: string;
  desc: string;
  icon: string;
  bgClass: string;
  action: () => void;
}

export const FeatureCarousel: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const features: Feature[] = [
    {
      id: 'owambe',
      title: 'Owambe Mode',
      desc: 'Spray money digitally.',
      icon: '🎉',
      bgClass: 'bg-purple-50 text-purple-900 border-purple-100',
      action: () => setPage('owambe')
    },
    {
        id: 'shield',
        title: 'Inflation Shield',
        desc: 'Save in stable USDC.',
        icon: '🛡️',
        bgClass: 'bg-emerald-50 text-emerald-900 border-emerald-100',
        action: () => setPage('explore', { filter: 'invest' })
    },
    {
        id: 'groupbuy',
        title: 'Group Buys',
        desc: 'Wholesale discounts.',
        icon: '🛒',
        bgClass: 'bg-orange-50 text-orange-900 border-orange-100',
        action: () => setPage('explore', { filter: 'group_buy' })
    },
    {
        id: 'waybill',
        title: 'Waybill Escrow',
        desc: 'Safe delivery payments.',
        icon: '🚚',
        bgClass: 'bg-amber-50 text-amber-900 border-amber-100',
        action: () => setPage('explore', { filter: 'waybill' })
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {features.map((f) => (
        <button 
            key={f.id}
            onClick={f.action}
            className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${f.bgClass}`}
        >
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-bold text-sm leading-tight">{f.title}</h3>
            <p className="text-[10px] opacity-80 mt-1 leading-snug">{f.desc}</p>
        </button>
      ))}
    </div>
  );
};
