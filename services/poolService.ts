
import type { PoolTP, PoolMembership, PoolCycle, MemberCycleObligation, CollateralAccount, PoolType, PoolDetailsData, LegacyPool } from '../types';
import { db } from '../lib/db';

// In-memory cycles for logic simplicity (to be replaced with real DB)
let cyclesTP: PoolCycle[] = [];

export async function getPools(): Promise<PoolTP[]> {
  await new Promise(r => setTimeout(r, 300));
  return db.getTrustPools().filter(p => p.is_active);
}

export async function getPoolWithDetails(poolId: string, userId?: string | null): Promise<PoolDetailsData | null> {
    await new Promise(r => setTimeout(r, 400));
    
    const pool = db.getTrustPools().find(p => p.id === poolId);
    if (!pool) return null;

    if (!userId) {
        return {
            pool,
            membership: null,
            collateral: null,
            obligations: [],
            guarantorRequests: []
        };
    }

    const membership = db.getMemberships(userId).find(m => m.pool_id === poolId) || null;
    const collateral = db.getCollateral(poolId, userId);
    
    // For cycles, we simulate them based on pool creation
    const obligations = db.getObligations(poolId, userId).map(o => ({
        ...o,
        cycle: cyclesTP.find(c => c.id === o.cycle_id) || { id: o.cycle_id, pool_id: poolId, cycle_number: 1, due_date: new Date().toISOString() }
    })).sort((a, b) => a.cycle.cycle_number - b.cycle.cycle_number);

    return {
        pool,
        membership,
        collateral,
        obligations,
        guarantorRequests: []
    };
}

export async function getLegacyPoolById(poolId: string): Promise<LegacyPool | null> {
    await new Promise(r => setTimeout(r, 300));
    return db.getLegacyPools().find(p => p.id === poolId) || null;
}

export async function createPool(
    payload: { 
        name: string; 
        description: string; 
        frequency: 'weekly'|'monthly'; 
        amount_kobo: number; 
        type: PoolType; 
        initialMembers?: string[];
        milestones?: { title: string; amount: number }[] 
    },
    userId: string
): Promise<PoolTP | LegacyPool> {
    
    await new Promise(r => setTimeout(r, 800));

    if (payload.type === 'ajo') {
        const newPool: PoolTP = {
            id: `pool-ajo-${Date.now()}`,
            name: payload.name,
            description: payload.description,
            currency: 'NGN',
            base_amount: payload.amount_kobo / 100,
            frequency: payload.frequency,
            collateral_ratio: 0.5,
            min_lock_cycles: 2,
            created_by: userId,
            is_active: true,
            created_at: new Date().toISOString()
        } as any; // Cast to avoid strict type checks on optional fields in prototype

        db.addTrustPool(newPool);
        await joinPool(newPool.id, userId);
        return newPool;

    } else {
        const newVenture: LegacyPool = {
            id: `pool-${payload.type}-${Date.now()}`,
            name: payload.name,
            description: payload.description,
            poolType: payload.type,
            frequency: payload.frequency,
            base_amount_kobo: payload.amount_kobo,
            raised_amount_kobo: 0,
            min_contribution_kobo: Math.round(payload.amount_kobo * 0.1),
            vote_threshold_pct: 51,
            is_active: true,
            created_by: userId,
            milestones: (payload.milestones || []).map((m, i) => ({
                id: Date.now() + i,
                title: m.title,
                amount_kobo: m.amount * 100,
                status: 'draft',
                position: i + 1,
                yes_votes_pct: 0
            })),
            // Initialize event/waybill defaults
            eventSettings: payload.type === 'event' ? { eventDate: new Date().toISOString(), venue: 'TBD', items: [] } : undefined,
            waybillData: payload.type === 'waybill' ? { origin: 'TBD', destination: 'TBD', status: 'waiting_funds' } : undefined
        };

        db.addLegacyPool(newVenture);
        return newVenture;
    }
}

export async function joinPool(poolId: string, userId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
    
    // Check if already joined
    const existing = db.getMemberships(userId).find(m => m.pool_id === poolId);
    if (existing) return;

    const membership: PoolMembership = {
        id: `mem-${Date.now()}`,
        pool_id: poolId,
        user_id: userId,
        status: 'active',
        join_date: new Date().toISOString(),
        trust_score: 50,
        current_default_state: 'none',
        consecutive_missed: 0,
        slot_count: 1
    };
    db.addMembership(membership);
    
    // Create collateral account
    const col: CollateralAccount = {
        id: `col-${Date.now()}`,
        pool_id: poolId,
        user_id: userId,
        locked_amount: 0,
        available_amount: 0,
        last_unlock_cycle: 0,
        updated_at: new Date().toISOString()
    };
    db.updateCollateral(col);
}

export async function recordContribution(poolId: string, userId: string, cycleId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 600));
    // In DB, mark as paid
    db.settleObligation(poolId, userId, cycleId);
    
    // Debit wallet (simulated, we assume user has funds or just track payment)
    // db.debitWallet(userId, amount); 
    // For now we assume successful external payment credit first
}

export async function withdrawCollateral(poolId: string, userId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 800));
    const col = db.getCollateral(poolId, userId);
    if (col && col.available_amount > 0) {
        db.creditWallet(userId, col.available_amount * 100); // Credit back to wallet
        col.available_amount = 0;
        db.updateCollateral(col);
    }
}

export async function inviteGuarantor(poolId: string, requesterId: string, guarantorEmail: string): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
    // Mock success
}

export async function getAllPools(): Promise<(PoolTP | LegacyPool)[]> {
    await new Promise(r => setTimeout(r, 300));
    return [...db.getTrustPools(), ...db.getLegacyPools()];
}

export async function contributeToLegacyPool(poolId: string, amount_kobo: number): Promise<void> {
    await new Promise(r => setTimeout(r, 500));
    const pool = db.getLegacyPools().find(p => p.id === poolId);
    if (pool) {
        pool.raised_amount_kobo += amount_kobo;
        db.updateLegacyPool(pool);
    }
}

export async function getWalletBalance(): Promise<number> {
    // In real app, user ID comes from auth context. 
    // Here we use a fixed key or get from localStorage if we tracked it
    // For prototype, we use 'mock-user-id' or the one from `App.tsx` state
    const userId = 'mock-user-id'; // Simplified for direct service call
    return db.getBalance(userId);
}

export async function getActiveUserPools(): Promise<any[]> {
    return [
        { type: 'ajo', id: '1', label: '₦20k Weekly Ajo', refSuggested: 'AJO:WEEKLY-20K', role: 'member' }
    ];
}

export async function getAdminUserPools(userId: string): Promise<any[]> {
    return getActiveUserPools();
}

export async function voteOnMilestone(milestoneId: number, vote: 'yes' | 'no'): Promise<{ yes_pct: number; accepted: boolean }> {
    return { yes_pct: vote === 'yes' ? 100 : 0, accepted: vote === 'yes' };
}

export async function confirmGroupBuyReceipt(poolId: string, userId: string): Promise<any> {
    return { completed: true, total_confirmed: 1 };
}

export async function getMyPools(userId: string): Promise<(PoolTP | LegacyPool)[]> {
    await new Promise(r => setTimeout(r, 300));
    const memberships = db.getMemberships(userId);
    const trustPools = db.getTrustPools().filter(p => memberships.some(m => m.pool_id === p.id));
    
    // Also get legacy pools created by user (simplified membership for legacy)
    const legacy = db.getLegacyPools().filter(p => p.created_by === userId);
    
    return [...trustPools, ...legacy];
}
