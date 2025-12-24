import type { RefinanceRequest } from '../types';

export const mockRefinanceRequests: RefinanceRequest[] = [
    {
        id: 'ref-1',
        user_id: 'mock-user-id',
        amount_kobo: 5000000, // 50k loan
        collateral_locked_kobo: 5000000,
        interest_rate_bps: 500, // 5%
        repayment_due_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'active',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: 'ref-2',
        user_id: 'mock-user-id',
        amount_kobo: 2000000, // 20k loan
        collateral_locked_kobo: 2000000,
        interest_rate_bps: 500,
        repayment_due_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        status: 'repaid',
        created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    }
];
