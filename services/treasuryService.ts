
import type { PoolTreasuryPolicy, LiquidityPosition, OpsHealth } from '../types';
import { mockTreasuryPolicy, mockLiquidityPosition, mockOpsHealth } from '../data/treasuryMockData';
import { submitAdminActionRequest } from './adminService';

// In-memory store for the mock
// We now rely on the shared mutable export from data/treasuryMockData for policy state

export interface ConsolidatedTreasuryData {
    policy: PoolTreasuryPolicy;
    liquidity: LiquidityPosition;
    opsHealth: OpsHealth;
    poolName: string; // Add pool name for context
}

/**
 * Fetches all treasury-related data for a specific pool.
 */
export async function getPoolTreasuryData(poolId: string): Promise<ConsolidatedTreasuryData> {
    console.log(`MOCK: getPoolTreasuryData for pool ${poolId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, you'd make multiple calls or a single call to a consolidated RPC.
    return {
        policy: JSON.parse(JSON.stringify(mockTreasuryPolicy)),
        liquidity: JSON.parse(JSON.stringify(mockLiquidityPosition[0])),
        opsHealth: JSON.parse(JSON.stringify(mockOpsHealth)),
        poolName: poolId === '1' ? '₦20k Weekly Ajo' : 'Epe Land Banking',
    };
}

/**
 * Fetches all liquidity positions for the ops dashboard.
 */
export async function getLiquidityPositions(): Promise<LiquidityPosition[]> {
    console.log(`MOCK: getLiquidityPositions`);
    await new Promise(resolve => setTimeout(resolve, 400));
    return JSON.parse(JSON.stringify(mockLiquidityPosition));
}


/**
 * Submits a request to update a pool's treasury policy.
 * This replaces the direct update model with the Maker-Checker approval workflow.
 */
export async function updatePoolTreasuryPolicy(poolId: string, updates: Partial<PoolTreasuryPolicy>): Promise<void> {
    console.log(`MOCK: requestUpdatePoolTreasuryPolicy for pool ${poolId}`, updates);
    
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
