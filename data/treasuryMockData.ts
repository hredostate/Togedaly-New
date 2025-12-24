
import type { PoolTreasuryPolicy, LiquidityPosition, OpsHealth } from '../types';

export const mockTreasuryPolicy: PoolTreasuryPolicy = {
  pool_id: '1', // Corresponds to a mock pool ID
  kill_draws: false,
  kill_unlocks: false,
  kill_payments: true, // Example of one being active
  per_user_daily_draw_ngn: 50000,
  per_org_daily_draw_ngn: 500000,
  per_user_daily_unlock_ngn: 20000,
  max_draw_pct: 0.50,
  min_reserve_pct: 0.20,
  updated_at: new Date(Date.now() - 3600000).toISOString(),
};

export const mockLiquidityPosition: LiquidityPosition[] = [
    {
        org_id: 'org-123',
        pool_id: '1',
        total_locked: 1250000, // 1.25M
        max_draw_pct: 0.50,
        min_reserve_pct: 0.20,
        vol_buf: 0.10, // volatility buffer
        next_14d_due: 80000,
        pending_draws: 50000,
        draw_capacity: 120000,
    },
    {
        org_id: 'org-123',
        pool_id: '2',
        total_locked: 5800000,
        max_draw_pct: 0.60,
        min_reserve_pct: 0.15,
        vol_buf: 0.05,
        next_14d_due: 1200000,
        pending_draws: 250000,
        draw_capacity: 1870000,
    }
];


export const mockOpsHealth: OpsHealth = {
    org_id: 'org-123',
    errors_24h: 2,
    warns_24h: 5,
};
