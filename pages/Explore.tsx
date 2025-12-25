

import React, { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import type { PoolTP, LegacyPool } from '../types';
import { getAllPools } from '../services/poolService';
import type { Page } from '../App';
import { supabase } from '../supabaseClient';
import { useToasts } from '../components/ToastHost';
import { useKyc } from '../hooks/useKyc';
import CreatePoolModal from '../components/pools/CreatePoolModal';
import BecomeSupplierModal from '../components/suppliers/BecomeSupplierModal';

interface AjoPoolCardProps {
    pool: PoolTP;
    onClick: () => void;
}

const AjoPoolCard: React.FC<AjoPoolCardProps> = ({ pool, onClick }) => {
    const raised = pool.base_amount * 0.35; // Mock 35% raised
    const target = pool.base_amount;
    const progress = target > 0 ? Math.min((raised / target) * 100, 100) : 0;

    return (
        <button 
            onClick={onClick} 
            className="rounded-2xl border border-brand-100 bg-white p-4 block hover:shadow-soft text-left w-full transition-shadow focus:outline-none focus:ring-2 focus:ring-brand"
        >
            <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wider">{pool.frequency} AJO</div>
                {pool.is_active ? 
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Open</span> :
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800">Closed</span>
                }
            </div>
            <div className="font-semibold text-gray-800 mt-1 text-lg">{pool.name}</div>
            
            <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Target</span>
                    <span>₦{target.toLocaleString()}</span>
                </div>
                 <div className="text-xs text-gray-500 mt-1">Est. {progress.toFixed(0)}% full based on active members</div>
            </div>

            <div className="text-sm text-gray-600 mt-3 pt-3 border-t">Contribution: <span className="font-semibold text-gray-800">₦{pool.base_amount.toLocaleString()}</span> per cycle</div>
        </button>
    );
};

// Helper for Creator Tier Icon
function getCreatorTierIcon(score?: number) {
    if (score === undefined) return null;
    if (score >= 90) return <span title="The Odogwu (Verified Earner)">👑</span>;
    if (score >= 70) return <span title="Reliable (Trusted Manager)">✅</span>;
    if (score >= 50) return <span title="Building (New/Building)">🔨</span>;
    return <span title="Risky (High Risk)">⚠️</span>;
}

const LegacyPoolCard: React.FC<{ pool: LegacyPool, onClick: () => void, userLocation: string }> = ({ pool, onClick, userLocation }) => {
    const progress = pool.base_amount_kobo > 0 ? (pool.raised_amount_kobo / pool.base_amount_kobo) * 100 : 0;
    const typeDisplay: Record<string, string> = { 
        'invest': 'Investment', 
        'group_buy': 'Group Buy', 
        'event': 'Event',
        'waybill': 'Logistics' 
    };
    const isEvent = pool.poolType === 'event';
    const isWaybill = pool.poolType === 'waybill';
    
    // Check location restriction
    const isRestricted = pool.target_state && pool.target_state !== userLocation;
    const tierIcon = getCreatorTierIcon(pool.creator_score);
    
    return (
         <button 
            onClick={isRestricted ? undefined : onClick}
            disabled={!!isRestricted}
            className={`rounded-2xl border p-4 block text-left w-full transition-all focus:outline-none focus:ring-2 focus:ring-brand relative overflow-hidden ${isRestricted ? 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-brand hover:shadow-soft'}`}
        >
            {isRestricted && (
                <div className="absolute top-0 left-0 w-full h-full bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-bold border border-rose-200 shadow-sm">
                        🚫 Only available in {pool.target_state}
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-center relative z-0">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wider flex items-center gap-1">
                    {isEvent ? 'Owambe / Event' : isWaybill ? 'Waybill Escrow' : typeDisplay[pool.poolType] || 'Venture'}
                    {tierIcon && <span className="text-sm ml-1 cursor-help">{tierIcon}</span>}
                </div>
                <div className="flex gap-2">
                    {pool.target_state && !isRestricted && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            📍 {pool.target_state}
                        </span>
                    )}
                    {pool.is_active ? 
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Open</span> :
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800">Closed</span>
                    }
                </div>
            </div>
            <div className="font-semibold text-gray-800 mt-1 text-lg">{pool.name}</div>
            
            {isEvent ? (
                <div className="mt-3 text-sm text-gray-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{pool.eventSettings ? new Date(pool.eventSettings.eventDate).toDateString() : 'Date TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span>📍</span>
                        <span className="truncate">{pool.eventSettings?.venue || 'Venue TBA'}</span>
                    </div>
                </div>
            ) : isWaybill ? (
                <div className="mt-3 text-sm text-gray-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2 font-medium text-amber-900">
                        <span>🚚</span>
                        <span>{pool.waybillData?.origin} → {pool.waybillData?.destination}</span>
                    </div>
                    <div className="mt-1 text-xs text-amber-700 uppercase tracking-wide font-bold">
                        Status: {pool.waybillData?.status.replace('_', ' ')}
                    </div>
                </div>
            ) : (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Raised: ₦{(pool.raised_amount_kobo / 100).toLocaleString()}</span>
                        <span>Target: ₦{(pool.base_amount_kobo / 100).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-brand h-2 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-600 mt-3 pt-3 border-t">
                {isEvent ? (
                    <span className="text-purple-700 font-medium">Get your Aso-ebi & Tickets →</span>
                ) : isWaybill ? (
                    <span className="text-amber-700 font-medium">Manage Logistics →</span>
                ) : (
                    <>Min. Contribution: <span className="font-semibold text-gray-800">₦{(pool.min_contribution_kobo/100).toLocaleString()}</span></>
                )}
            </div>
        </button>
    );
};

const PoolCardSkeleton: React.FC = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded-full w-12"></div>
        </div>
        <div className="h-5 bg-slate-200 rounded w-3/4 mt-2"></div>
        <div className="mt-4">
            <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-1"></div>
        </div>
        <div className="h-px bg-slate-200 mt-3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mt-3"></div>
    </div>
);


interface ExploreProps {
    onPoolClick: (pool: PoolTP | LegacyPool, type: 'ajo' | 'legacy') => void;
    setPage: (page: Page, context?: any) => void;
    filter?: 'ajo' | 'invest' | 'group_buy' | 'event' | 'waybill';
}

const Explore: React.FC<ExploreProps> = ({ onPoolClick, setPage, filter }) => {
  const { data: pools, error, isLoading, mutate } = useSWR<(PoolTP | LegacyPool)[]>('explore-pools', getAllPools);
  const [userLocation, setUserLocation] = useState('Lagos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { status: kycStatus } = useKyc(userId || undefined);
  const { add: addToast } = useToasts();

  useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id || null));
  }, []);

  const displayedPools = useMemo(() => {
    if (!pools) return [];
    let filtered = pools;

    // Filter by type
    if (filter) {
        filtered = filtered.filter(p => {
            if ('collateral_ratio' in p) return filter === 'ajo';
            return p.poolType === filter;
        });
    }

    // Filter by search query
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(q);
            const descMatch = 'description' in p && p.description.toLowerCase().includes(q);
            return nameMatch || descMatch;
        });
    }

    // New pools first
    return filtered.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [pools, filter, searchQuery]);

  const handleCreatePool = () => {
      if (!userId) {
          addToast({ title: 'Sign In Required', desc: 'Please sign in to create a pool.', emoji: '🔒' });
          setPage('auth');
          return;
      }
      if (kycStatus !== 'verified') {
          addToast({ title: 'Verification Needed', desc: 'You must complete KYC to create pools.', emoji: '🆔' });
          setPage('kyc');
          return;
      }
      setShowCreateModal(true);
  };

  const handleBecomeSupplier = () => {
      if (!userId) {
          addToast({ title: 'Sign In Required', desc: 'Please sign in to register as a supplier.', emoji: '🔒' });
          setPage('auth');
          return;
      }
      if (kycStatus !== 'verified') {
          addToast({ title: 'Verification Needed', desc: 'You must complete KYC to register as a business.', emoji: '🆔' });
          setPage('kyc');
          return;
      }
      setShowSupplierModal(true);
  };

  const headers = {
      ajo: { title: 'Ajo Pools', desc: 'Join a rotating savings club for disciplined saving.' },
      invest: { title: 'Micro-Investments', desc: 'Fund verified ventures and earn returns.' },
      group_buy: { title: 'Group Buys', desc: 'Pool funds to buy items in bulk at wholesale prices.' },
      event: { title: 'Events & Aso-ebi', desc: 'Manage collections for weddings, burials, and parties.' },
      waybill: { title: 'Waybill Escrow', desc: 'Secure payments for inter-state deliveries.' }
  };

  const { title, desc } = filter ? headers[filter] : { title: 'Explore Pools', desc: 'Curated, community-powered pools for collective investment.' };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
            
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <button onClick={() => setPage('explore')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${!filter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'}`}>All</button>
                <button onClick={() => setPage('explore', { filter: 'ajo' })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${filter === 'ajo' ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'}`}>Ajo Pools</button>
                <button onClick={() => setPage('explore', { filter: 'invest' })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${filter === 'invest' ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'}`}>Investments</button>
                <button onClick={() => setPage('explore', { filter: 'group_buy' })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${filter === 'group_buy' ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'}`}>Group Buys</button>
                <button onClick={() => setPage('explore', { filter: 'waybill' })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${filter === 'waybill' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'}`}>🚚 Waybill</button>
                <button onClick={() => setPage('explore', { filter: 'event' })} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${filter === 'event' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-slate-200 hover:bg-slate-50'}`}>🎉 Events</button>
            </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full md:w-auto items-end">
            <div className="flex gap-2 w-full flex-wrap justify-end">
                <div className="relative flex-grow md:flex-grow-0 md:w-64">
                    <input 
                        type="text" 
                        placeholder="Search pools..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
                        style={{ backgroundColor: '#ffffff', color: '#111827' }}
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                
                {filter === 'group_buy' ? (
                    <button 
                        onClick={handleBecomeSupplier}
                        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-md whitespace-nowrap flex items-center gap-1"
                    >
                        <span>🤝</span> Become a Supplier
                    </button>
                ) : (
                    <button 
                        onClick={handleCreatePool}
                        className="px-3 py-2 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition shadow-md whitespace-nowrap flex items-center gap-1"
                    >
                        <span>+</span> Create Pool
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                    <span className="text-xs text-gray-500 mr-2 font-medium">Delivering to:</span>
                    <select 
                        value={userLocation} 
                        onChange={e => setUserLocation(e.target.value)} 
                        className="text-sm font-semibold bg-transparent border-none focus:ring-0 text-brand cursor-pointer py-1 pr-8"
                    >
                        <option value="Lagos">Lagos</option>
                        <option value="Ogun">Ogun</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Ibadan">Ibadan</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-800">
            <strong>Error:</strong> Failed to load pools. Please try again later.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <PoolCardSkeleton />
            <PoolCardSkeleton />
            <PoolCardSkeleton />
            <PoolCardSkeleton />
          </>
        ) : (
          <>
            {displayedPools.map(p => {
              if ('collateral_ratio' in p) { // This is a PoolTP (Ajo)
                return <AjoPoolCard key={p.id} pool={p} onClick={() => onPoolClick(p, 'ajo')} />
              } else { // This is a LegacyPool
                return <LegacyPoolCard key={p.id} pool={p} onClick={() => onPoolClick(p, 'legacy')} userLocation={userLocation} />
              }
            })}
            {!isLoading && displayedPools.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-dashed p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                <div className="text-3xl mb-2">🔍</div>
                <p>No {filter ? filter.replace('_', ' ') : ''} pools found {searchQuery ? `matching "${searchQuery}"` : 'at the moment'}.</p>
                {(filter || searchQuery) && (
                    <button 
                        onClick={() => { setPage('explore'); setSearchQuery(''); }}
                        className="mt-3 px-4 py-2 text-sm bg-brand text-white rounded-xl hover:bg-brand-700"
                    >
                        Clear Filters
                    </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {showCreateModal && userId && (
          <CreatePoolModal 
            userId={userId}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
                setShowCreateModal(false);
                mutate(); // Refresh the pool list
            }}
          />
      )}

      {showSupplierModal && (
          <BecomeSupplierModal 
            onClose={() => setShowSupplierModal(false)}
            onSuccess={() => setShowSupplierModal(false)}
          />
      )}
    </div>
  );
};

export default Explore;