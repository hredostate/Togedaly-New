
import type { PoolTreasuryPolicy, LiquidityPosition, OpsHealth } from '../types';
import { submitAdminActionRequest } from './adminService';

export interface ConsolidatedTreasuryData {
    policy: PoolTreasuryPolicy;
    liquidity: LiquidityPosition;
    opsHealth: OpsHealth;
    poolName: string; // Add pool name for context
}

// In-memory stores (to be replaced with real DB)
let treasuryPolicies: Record<string, PoolTreasuryPolicy> = {};
let liquidityPositions: LiquidityPosition[] = [];
let opsHealthData: OpsHealth = { arrears_kobo: 0, dlq_count: 0, defaults_30d: 0, refund_pending_kobo: 0 };

/**
 * Fetches all treasury-related data for a specific pool.
 */
export async function getPoolTreasuryData(poolId: string): Promise<ConsolidatedTreasuryData> {
    console.log(`getPoolTreasuryData for pool ${poolId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        policy: treasuryPolicies[poolId] || {} as PoolTreasuryPolicy,
        liquidity: liquidityPositions[0] || {} as LiquidityPosition,
        opsHealth: opsHealthData,
        poolName: poolId === '1' ? '₦20k Weekly Ajo' : 'Pool',
    };
}

/**
 * Fetches all liquidity positions for the ops dashboard.
 */
export async function getLiquidityPositions(): Promise<LiquidityPosition[]> {
    console.log(`getLiquidityPositions`);
    await new Promise(resolve => setTimeout(resolve, 400));
    return JSON.parse(JSON.stringify(liquidityPositions));
}


/**
 * Submits a request to update a pool's treasury policy.
 * This replaces the direct update model with the Maker-Checker approval workflow.
 */
export async function updatePoolTreasuryPolicy(poolId: string, updates: Partial<PoolTreasuryPolicy>): Promise<void> {
    console.log(`requestUpdatePoolTreasuryPolicy for pool ${poolId}`, updates);
    
    // Instead of applying updates directly, we submit a request.
    await submitAdminActionRequest(
        1, // Mock Org ID
        poolId,
        'treasury_policy_update',
        'pool_treasury_policy',
        poolId,
        updates, // payload
        'mock-admin-id' // current user
    );
}
