
import React from 'react';
import useSWR from 'swr';
import { getUserProgress } from '../../services/gamificationService';
import { getTrustScoreBreakdown } from '../../services/trustScoreService';
import type { UserProgress } from '../../types';

const TrustScoreTab: React.FC = () => {
    const { data: progress, isLoading: progressLoading, error: progressError } = useSWR<UserProgress | null>('user-progress', getUserProgress);
    const { data: breakdown, isLoading: breakdownLoading } = useSWR<{ score: number; factors: any[] } | null>(
        progress ? ['trust-score-breakdown', 'mock-user-id'] : null,
        ([_, userId]) => getTrustScoreBreakdown(userId as string)
    );

    if (progressLoading || breakdownLoading) {
        return <div className="p-4">Loading trust score...</div>;
    }

    if (progressError || !progress) {
        return <div className="p-4 text-center">Could not load your trust score.</div>;
    }

    const score = progress.trust_score;
    const circumference = 2 * Math.PI * 56; // 2 * pi * r
    const offset = circumference - (score / 100) * circumference;

    const color = score > 80 ? 'text-emerald-500' : score > 50 ? 'text-brand' : 'text-amber-500';
    
    // Use factors from API or fallback to empty array
    const factors = breakdown?.factors || [];

    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-white p-6 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle className="text-slate-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="56" cx="60" cy="60" />
                        <circle
                            className={color}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="56"
                            cx="60"
                            cy="60"
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${color}`}>
                        {score}
                    </div>
                </div>
                <h3 className="font-semibold text-lg mt-4">Your Trust Score</h3>
                <p className="text-sm text-gray-500 text-center">A higher score unlocks better rates and exclusive pools.</p>
            </div>
            <div className="rounded-2xl border bg-white p-4">
                 <h3 className="font-semibold text-lg">Contributing Factors</h3>
                 <div className="mt-2 space-y-2">
                    {factors.map((f, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-sm">
                            <span className="text-gray-700">{f.label}</span>
                            <span className={`font-semibold ${f.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{f.value}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default TrustScoreTab;
