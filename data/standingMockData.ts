import type { Dispute, DefaultEvent } from '../types';

export const mockDisputes: Dispute[] = [
    {
        id: 'disp-1',
        user_id: 'mock-user-id',
        org_id: 1,
        kind: 'payout',
        ref: 'payout-123',
        title: 'Payout amount incorrect',
        body: 'The payout I received was ₦5,000 short of what was expected.',
        status: 'open',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'disp-2',
        user_id: 'user-002',
        org_id: 1,
        kind: 'groupbuy',
        ref: 'groupbuy-abc',
        title: 'Item not as described',
        body: 'The cow we received was smaller than the one advertised.',
        status: 'in_review',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

export const mockDefaultEvents: DefaultEvent[] = [
    {
        id: 'def-1',
        user_id: 'mock-user-id',
        pool_id: '1',
        cycle_id: '1001',
        state: 'penalty',
        penalty_amount: 500, // NGN
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    }
];
