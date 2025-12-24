
import React, { useEffect } from 'react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, onClose }) => {
  useEffect(() => {
    // Trigger confetti when mounted
    window.dispatchEvent(new CustomEvent('trigger-confetti'));
  }, []);

  const perks = [
    level >= 2 ? "Vote Weight +10%" : null,
    level >= 3 ? "Instant Withdrawals" : null,
    level >= 5 ? "Create Private Pools" : null,
    "New Badge Unlocked"
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center relative overflow-hidden transform transition-all scale-100 animate-fade-in-up">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-100 to-white opacity-50"></div>
        
        <div className="relative z-10">
            <div className="w-24 h-24 mx-auto bg-brand text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg shadow-brand/30 border-4 border-white mb-4">
                {level}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Level Up!</h2>
            <p className="text-gray-500 text-sm mb-6">You are moving up in the world, Odogwu.</p>

            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 mb-6 border border-slate-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Perks Unlocked</div>
                <ul className="space-y-2">
                    {perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-emerald-500">✓</span> {perk}
                        </li>
                    ))}
                </ul>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
                Claim Rewards
            </button>
        </div>
      </div>
    </div>
  );
};
