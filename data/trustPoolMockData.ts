

import type { PoolTP, PoolMembership, PoolCycle, MemberCycleObligation, CollateralAccount } from '../types';

export const mockPoolsTP: PoolTP[] = [
    {
        id: '1',
        name: '₦20k Weekly Ajo',
        currency: 'NGN',
        base_amount: 20000,
        frequency: 'weekly',
        collateral_ratio: 0.50, // Updated to 50%
        min_lock_cycles: 4,
        created_by: 'admin-user-id',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        is_active: true,
    },
    {
        id: 'shield-1',
        name: 'Japa Target (USDC Pegged)',
        currency: 'NGN',
        base_amount: 100000,
        frequency: 'monthly',
        collateral_ratio: 0.20,
        min_lock_cycles: 6,
        created_by: 'admin-user-id',
        created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        is_active: true,
        inflation_shield: true, // NEW
    }
];

export const mockMembershipsTP: PoolMembership[] = [
    {
        id: '101',
        pool_id: '1',
        user_id: 'mock-user-id',
        status: 'active',
        join_date: new Date(Date.now() - 29 * 86400000).toISOString(),
        trust_score: 85,
        current_default_state: 'none',
        consecutive_missed: 0,
        slot_count: 1,
    },
    {
        id: 'mem-shield-1',
        pool_id: 'shield-1',
        user_id: 'mock-user-id',
        status: 'active',
        join_date: new Date(Date.now() - 89 * 86400000).toISOString(),
        trust_score: 85,
        current_default_state: 'none',
        consecutive_missed: 0,
        slot_count: 1,
    }
];

export const mockCyclesTP: PoolCycle[] = [
    // Pool 1 cycles (existing logic...)
    ...Array.from({ length: 12 }, (_, i) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i - 2) * 7); // Start 2 weeks ago
        return {
            id: `100${i + 1}`,
            pool_id: '1',
            cycle_number: i + 1,
            due_date: dueDate.toISOString().split('T')[0],
        };
    }),
    // Pool Shield-1 cycles (Monthly)
    ...Array.from({ length: 12 }, (_, i) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i - 3)); // Started 3 months ago
        return {
            id: `cy-shield-${i + 1}`,
            pool_id: 'shield-1',
            cycle_number: i + 1,
            due_date: dueDate.toISOString().split('T')[0],
        };
    })
];

export const mockObligationsTP: MemberCycleObligation[] = [
    // Pool 1 Obligations
    ...mockCyclesTP.filter(c => c.pool_id === '1').map((cycle, i) => ({
        id: `ob-1-${i}`,
        pool_id: '1',
        user_id: 'mock-user-id',
        cycle_id: cycle.id,
        contribution_due: 20000,
        collateral_due: 10000, // Updated: 20000 * 0.50
        is_settled: i < 2, // First two cycles are settled
        settled_at: i < 2 ? new Date(new Date(cycle.due_date).getTime() - 86400000).toISOString() : undefined,
    })),
    // Pool Shield-1 Obligations (3 settled)
    ...mockCyclesTP.filter(c => c.pool_id === 'shield-1').map((cycle, i) => ({
        id: `ob-shield-${i}`,
        pool_id: 'shield-1',
        user_id: 'mock-user-id',
        cycle_id: cycle.id,
        contribution_due: 100000,
        collateral_due: 20000,
        is_settled: i < 3,
        settled_at: i < 3 ? new Date(new Date(cycle.due_date).getTime() - 86400000).toISOString() : undefined,
    }))
];

export const mockCollateralAccountsTP: CollateralAccount[] = [
    {
        id: '1',
        pool_id: '1',
        user_id: 'mock-user-id',
        locked_amount: 20000, // Updated: From 2 settled cycles (10000 * 2)
        available_amount: 0,
        last_unlock_cycle: 0,
        updated_at: new Date().toISOString(),
    },
    {
        id: 'col-shield',
        pool_id: 'shield-1',
        user_id: 'mock-user-id',
        locked_amount: 60000, // 3 * 20000
        available_amount: 0,
        last_unlock_cycle: 0,
        updated_at: new Date().toISOString(),
    }
];