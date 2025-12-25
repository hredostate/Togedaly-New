
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { getAdviserFeed, getRevenueDigest } from '../services/geminiService';
import { getRevenueHistory } from '../services/payoutService';
import type { AdviserTip, PoolTP, LegacyPool } from '../types';
import type { Page } from '../App';
import XpTrustStrip from '../components/gamify/XpTrustStrip';
import Badges from '../components/gamify/Badges';
import Leaderboard from '../components/gamify/Leaderboard';
import { getMyPools } from '../services/poolService';
import NextBestActionCard from '../components/NextBestActionCard';
import { useTour } from '../components/onboarding/TourContext';
import { Skeleton } from '../components/ui/Skeleton';
import { MoodTracker } from '../components/dashboard/MoodTracker';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FeatureCarousel } from '../components/dashboard/FeatureCarousel';
import { DreamBoard } from '../components/dashboard/DreamBoard';
import { ProfileBuilderCard } from '../components/dashboard/ProfileBuilderCard';
import { supabase } from '../supabaseClient';

const MyPoolsList: React.FC<{ setPage: (page: Page, context?: any) => void; userId: string }> = ({ setPage, userId }) => {
    const { data: pools, error, isLoading } = useSWR<(PoolTP | LegacyPool)[]>(['my-pools', userId], () => getMyPools(userId));

    const handlePoolClick = (pool: PoolTP | LegacyPool) => {
        const isTrustPool = 'collateral_ratio' in pool;
        setPage(isTrustPool ? 'poolDetails' : 'ventureDetails', { pool });
    };

    if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>;
    if (error) return <div className="text-center text-sm text-gray-500 py-4">Failed to load pools.</div>;
    if (!pools || pools.length === 0) return (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-gray-500 mb-2">No active investments yet.</p>
            <button onClick={() => setPage('explore')} className="text-brand font-semibold text-sm hover:underline">Explore Pools</button>
        </div>
    );

    return (
        <div className="space-y-3">
            {pools.map(pool => {
                const isAjo = 'collateral_ratio' in pool;
                const progress = isAjo ? 0 : (pool as LegacyPool).raised_amount_kobo / (pool as LegacyPool).base_amount_kobo * 100;
                
                return (
                    <button 
                        key={pool.id} 
                        onClick={() => handlePoolClick(pool)}
                        className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">{pool.name}</h4>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                    {isAjo ? 'AJO CYCLE' : (pool as LegacyPool).poolType.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded-lg text-gray-400 group-hover:bg-brand-50 group-hover:text-brand transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                        {!isAjo && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-brand h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default function Dashboard({ setPage }: { setPage: (page: Page, context?: any) => void }) {
  const { startTour } = useTour();
  const [tab, setTab] = useState<'overview' | 'rewards'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour) {
        setTimeout(() => {
            startTour([
                { 
                    targetId: 'dash-header', 
                    title: 'Your Command Center', 
                    content: "This is where your money lives. Check balance, streak, and mood here.",
                    position: 'bottom'
                },
                {
                    targetId: 'dash-action',
                    title: 'Adviser T',
                    content: "I'll always show you the smartest move to make right here.",
                    position: 'bottom'
                }
            ]);
            localStorage.setItem('hasSeenDashboardTour', 'true');
        }, 1500);
    }
  }, [startTour]);

  const userId = user?.id || 'mock-user-id';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* 1. Unified Header */}
      <div id="dash-header">
        <DashboardHeader user={user} setPage={setPage} />
      </div>

      {/* 2. Mood Tracker (Engagement) */}
      <MoodTracker userId={userId} />

      {/* 3. Dream Board (New Goal Tracker) */}
      <DreamBoard userId={userId} />

      {/* 4. High Priority Action (The "Hook") */}
      <div id="dash-action">
        <NextBestActionCard orgId={1} userId={userId} />
      </div>

      {/* 5. Profile Builder (Context Gathering) */}
      <ProfileBuilderCard userId={userId} />

      {/* 6. Tabs for Content Organization */}
      <div>
          <div className="flex p-1 bg-slate-100/80 backdrop-blur rounded-2xl mb-4">
              <button 
                onClick={() => setTab('overview')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === 'overview' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setTab('rewards')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === 'rewards' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Rewards & Stats
              </button>
          </div>

          {tab === 'overview' ? (
              <div className="space-y-6 animate-fade-in">
                  <section>
                      <div className="flex justify-between items-center mb-3 px-1">
                          <h3 className="font-bold text-gray-800">Quick Actions</h3>
                      </div>
                      <FeatureCarousel setPage={setPage} />
                  </section>

                  <section>
                      <div className="flex justify-between items-center mb-3 px-1">
                          <h3 className="font-bold text-gray-800">Active Investments</h3>
                          <button onClick={() => setPage('explore')} className="text-xs font-medium text-brand hover:underline">Find New +</button>
                      </div>
                      <MyPoolsList setPage={setPage} userId={userId} />
                  </section>
              </div>
          ) : (
              <div className="space-y-6 animate-fade-in">
                  <XpTrustStrip userId={userId} />
                  <Badges userId={userId} />
                  <Leaderboard userId={userId} />
              </div>
          )}
      </div>
    </div>
  );
}
