import type { VirtualAccount, IncomingTransfer } from '../types';

export const mockVirtualAccounts: VirtualAccount[] = [
    {
        id: 'va-uuid-1',
        user_id: 'mock-user-id',
        provider_slug: 'wema-bank',
        account_number: '9876543210',
        bank_name: 'Wema Bank',
        account_name: 'TOGEDALY/ADANNA THE GOAT',
        active: true,
        assigned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
];

export const mockIncomingTransfers: IncomingTransfer[] = [
    {
        id: 'it-uuid-1',
        user_id: 'mock-user-id',
        amount_kobo: 5000000, // ₦50,000
        currency: 'NGN',
        provider_slug: 'wema-bank',
        sender_bank: 'GTBank',
        sender_account_number: '...1234',
        receiver_account_number: '9876543210',
        narration: 'Payment for cow share',
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
        id: 'it-uuid-2',
        user_id: 'mock-user-id',
        amount_kobo: 2500000, // ₦25,000
        currency: 'NGN',
        provider_slug: 'wema-bank',
        sender_bank: 'First Bank',
        sender_account_number: '...5678',
        receiver_account_number: '9876543210',
        narration: 'Ajo contribution',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    }
];
