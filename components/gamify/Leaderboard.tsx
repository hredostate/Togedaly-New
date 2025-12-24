import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../../services/gamificationService';

const LeaderboardSkeleton = () => (
    <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
        ))}
    </div>
);


const Leaderboard: React.FC = () => {
  const [rows, setRows] = useState<{ display_name: string, xp: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
        setLoading(true);
        const data = await getLeaderboard();
        setRows(data);
        setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <h3 className="font-semibold text-gray-800 mb-2">Leaderboard</h3>
      {loading ? (
        <LeaderboardSkeleton />
      ) : (
        <div className="space-y-1 text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-6 text-center text-gray-500 font-medium">{i + 1}.</div>
                <div className="font-medium text-gray-700">{r.display_name || 'Anonymous Member'}</div>
              </div>
              <div className="text-gray-600 font-semibold">{r.xp.toLocaleString()} XP</div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-gray-500 w-full text-center py-4">Be the first on the leaderboard!</div>}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
