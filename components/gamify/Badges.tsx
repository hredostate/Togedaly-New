import React, { useEffect, useState } from 'react';
import { getUserBadges } from '../../services/gamificationService';
import type { UserBadge } from '../../types';

const BADGE_MAP: Record<string, { emoji: string; title: string; }> = {
  'first_join': { emoji: '🐣', title: 'First Join' },
  'vote_10': { emoji: '🗳️', title: 'Civic Champ' },
  'streak_30': { emoji: '🔥', title: '30-day Streak' },
  'proof_master': { emoji: '📸', title: 'Proof Master' },
  'verified': { emoji: '✅', title: 'Verified' },
};

const BadgeSkeleton = () => (
    <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse"></div>
);

const Badges: React.FC = () => {
  const [items, setItems] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
        setLoading(true);
        const data = await getUserBadges();
        setItems(data);
        setLoading(false);
    };
    fetchBadges();
  }, []);

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <h3 className="font-semibold text-gray-800 mb-2">Badges</h3>
      {loading ? (
        <div className="flex flex-wrap gap-2">
            <BadgeSkeleton />
            <BadgeSkeleton />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((b) => {
            const meta = BADGE_MAP[b.badge_code] || { emoji: '🏅', title: b.badge_code };
            return (
              <div key={b.badge_code} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm flex items-center gap-2">
                <span className="text-lg">{meta.emoji}</span>
                <span>{meta.title}</span>
              </div>
            );
          })}
          {items.length === 0 && <div className="text-sm text-gray-500 w-full text-center py-4">No badges yet. Join a pool to start!</div>}
        </div>
      )}
    </div>
  );
};

export default Badges;