
import React, { useState, useEffect } from 'react';
import { useToasts } from '../ToastHost';

export const StreakCounter: React.FC = () => {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();

  useEffect(() => {
    const checkStreak = () => {
      const storedStreak = parseInt(localStorage.getItem('daily_streak') || '0', 10);
      const lastLoginDate = localStorage.getItem('last_login_date');
      const today = new Date().toDateString();

      if (lastLoginDate === today) {
        // Already logged in today
        setStreak(storedStreak);
      } else if (lastLoginDate === new Date(Date.now() - 86400000).toDateString()) {
        // Logged in yesterday, increment streak
        const newStreak = storedStreak + 1;
        setStreak(newStreak);
        localStorage.setItem('daily_streak', newStreak.toString());
        localStorage.setItem('last_login_date', today);
        
        // Celebration for keeping the streak
        setTimeout(() => {
            addToast({ 
                title: "Streak Increased! 🔥", 
                desc: `You're on a ${newStreak}-day roll! Keep it up.`, 
                emoji: "🔥" 
            });
        }, 2000);
      } else {
        // Streak broken or first time
        // If it's not the first time ever (lastLoginDate exists), maybe show a "Streak Lost" message? 
        // For positivity, we'll just start at 1.
        const newStreak = 1;
        setStreak(newStreak);
        localStorage.setItem('daily_streak', newStreak.toString());
        localStorage.setItem('last_login_date', today);
      }
      setLoading(false);
    };

    checkStreak();
  }, [addToast]);

  if (loading) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full shadow-sm hover:shadow-md transition-all cursor-help" title="Daily Login Streak">
      <span className="text-lg animate-pulse">🔥</span>
      <span className="text-sm font-bold text-orange-600">{streak}</span>
    </div>
  );
};
