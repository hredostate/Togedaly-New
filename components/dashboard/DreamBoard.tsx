
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getWalletBalance } from '../../services/poolService';

export const DreamBoard: React.FC<{ userId: string }> = ({ userId }) => {
    const { data: balanceKobo } = useSWR(['wallet-balance', userId], () => getWalletBalance(userId));
    const [target, setTarget] = useState(500000); // Default 500k
    const [goalName, setGoalName] = useState('Japa Fund ✈️');
    const [isEditing, setIsEditing] = useState(false);

    const balance = (balanceKobo || 0) / 100;
    const percentage = Math.min(100, Math.max(0, (balance / target) * 100));
    
    // Simple persistence per user
    useEffect(() => {
        const savedTarget = localStorage.getItem(`dream_target_${userId}`);
        const savedName = localStorage.getItem(`dream_name_${userId}`);
        if (savedTarget) setTarget(parseInt(savedTarget, 10));
        if (savedName) setGoalName(savedName);
    }, [userId]);

    const handleSave = () => {
        localStorage.setItem(`dream_target_${userId}`, target.toString());
        localStorage.setItem(`dream_name_${userId}`, goalName);
        setIsEditing(false);
    };

    // Circular Progress Calculation
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 p-5 text-white shadow-lg relative overflow-hidden">
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-brand/20 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex justify-between items-center">
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2 mb-2">
                            <input 
                                value={goalName} 
                                onChange={e => setGoalName(e.target.value)} 
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-full text-white placeholder-white/50"
                                placeholder="Goal Name"
                            />
                            <input 
                                type="number"
                                value={target} 
                                onChange={e => setTarget(parseInt(e.target.value))} 
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-full text-white"
                                placeholder="Target Amount"
                            />
                            <button onClick={handleSave} className="text-xs bg-white text-brand font-bold px-2 py-1 rounded">Save</button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setIsEditing(true)}>
                                <h3 className="font-bold text-lg">{goalName}</h3>
                                <svg className="w-3 h-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                            <div className="text-indigo-200 text-sm mt-1">
                                ₦{balance.toLocaleString()} / ₦{target.toLocaleString()}
                            </div>
                            <p className="text-xs text-indigo-300 mt-3">
                                {percentage >= 100 ? "Goal Reached! 🎉" : `You're ${percentage.toFixed(0)}% there. Keep pushing!`}
                            </p>
                        </>
                    )}
                </div>

                <div className="relative w-24 h-24 flex-shrink-0 ml-4">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-white/10"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="text-brand-400 transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                        {percentage.toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
};
