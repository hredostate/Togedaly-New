import type { PayoutRun, PayoutInstruction } from '../types';

export const mockPayoutRuns: PayoutRun[] = [
    {
        id: 1,
        pool_id: '1', // ₦20k Weekly Ajo
        cycle_id: '1003', // A cycle due today
        run_at: new Date().toISOString(),
        created_by: 'cron',
    }
];

export const mockPayoutInstructions: PayoutInstruction[] = [
    {
        id: 101,
        run_id: 1,
        pool_id: '1',
        cycle_id: '1003',
        user_id: 'mock-user-id',
        slot_index: 1,
        rotation_position: 3, // Assuming this is the rotation for cycle 3
        amount: 20000 * 1, // base_amount * total_slots (mocked as 1 for simplicity)
        status: 'scheduled',
        meta: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 102,
        run_id: 1,
        pool_id: '1',
        cycle_id: '1002', // A past cycle
        user_id: 'another-user-id',
        slot_index: 1,
        rotation_position: 2,
        amount: 20000,
        status: 'paid',
        provider_ref: 'PAYSTACK-TRANSFER-XYZ',
        meta: {},
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    }
];
