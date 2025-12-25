
import React, { useEffect, useState, useRef } from 'react';
import { getUserProgress } from '../../services/gamificationService';
import type { UserProgress } from '../../types';
import { LevelUpModal } from './LevelUpModal';

const XpTrustStrip: React.FC<{ userId: string }> = ({ userId }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      const data = await getUserProgress(userId);
      setProgress(data);
      setLoading(false);

      if (data) {
        // Check for level up
        if (prevLevelRef.current !== null && data.level > prevLevelRef.current) {
            setShowLevelUp(true);
        }
        prevLevelRef.current = data.level;
      }
    };
    fetchProgress();
  }, [userId]);

  if (loading) {
      return (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-200 rounded"></div>
              <div className="flex-1 space-y-2">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="h-2 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div className="h-10 w-10 bg-slate-200 rounded"></div>
          </div>
      );
  }
  
  if (!progress) {
      return null;
  }

  const xpForNextLevel = 500;
  const xpInCurrentLevel = progress.xp % xpForNextLevel;
  const progressPct = Math.min(100, Math.round((xpInCurrentLevel / xpForNextLevel) * 100));

  return (
    <>
        <div className="rounded-2xl border border-brand-100 bg-white p-4 flex items-center gap-4 shadow-sm">
        <div className="text-center">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Level</div>
            <div className="text-2xl font-bold text-brand-600">{progress.level}</div>
        </div>
        <div className="flex-1">
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand to-indigo-400 transition-all duration-1000" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-1.5 flex justify-between">
            <span>{progress.xp.toLocaleString()} XP</span>
            <span>{Math.round(xpForNextLevel - xpInCurrentLevel)} to next lvl</span>
            </div>
        </div>
        <div className="text-center pl-4 border-l border-slate-100">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Trust</div>
            <div className="text-2xl font-bold text-emerald-600">{progress.trust_score}</div>
        </div>
        </div>
        
        {showLevelUp && (
            <LevelUpModal level={progress.level} onClose={() => setShowLevelUp(false)} />
        )}
    </>
  );
}

export default XpTrustStrip;
