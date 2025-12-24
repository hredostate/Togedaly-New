
import type { Dispute } from '../types';

export const mockDisputes: Dispute[] = [
    {
        id: 'disp-101',
        user_id: 'user-001',
        org_id: 1,
        kind: 'payout',
        ref: 'tx-998877',
        title: 'Payout delayed by 24h',
        body: 'I was expecting my rotation payout yesterday. It is still showing as pending.',
        status: 'open',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: 'disp-102',
        user_id: 'user-002',
        org_id: 1,
        kind: 'groupbuy',
        ref: 'gb-cow-2024',
        title: 'Quality issue with Cow Share',
        body: 'The meat share I received was mostly bone. I want a partial refund.',
        status: 'in_review',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
        id: 'disp-103',
        user_id: 'user-001',
        org_id: 1,
        kind: 'ajo',
        ref: 'pool-1',
        title: 'Incorrect penalty charge',
        body: 'I paid on time but was charged a late fee. Please reverse.',
        status: 'resolved',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    }
];
