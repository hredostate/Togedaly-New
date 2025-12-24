
export const mockOrgHealth = {
    active_users: 1250,
    churn_rate: 2.5,
    mrr: 4500000,
    total_volume: 150000000,
    risk_score: 12, // Low
};

export const mockOrgArrears = [
    { user_id: 'user-005', amount: 50000, days_overdue: 5 },
    { user_id: 'user-012', amount: 20000, days_overdue: 12 },
    { user_id: 'user-044', amount: 120000, days_overdue: 2 },
];

export const mockUnlockEligibility = [
    { user_id: 'user-001', amount: 50000, pool_id: 'pool-1' },
    { user_id: 'user-004', amount: 25000, pool_id: 'pool-2' },
];
