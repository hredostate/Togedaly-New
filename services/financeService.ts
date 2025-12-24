
import type { ReconSummary, Payout, ReconMismatch } from '../types';

let mockMismatches: ReconMismatch[] = [
    { wallet_id: 'w-abc-123', currency: 'NGN', ledger: 10050, cached: 10000, diff: 50 },
    { wallet_id: 'w-def-456', currency: 'NGN', ledger: 25000, cached: 25500, diff: -500 },
];

// FIX: Corrected mock data to align with the Payout type
let mockPayouts: Payout[] = [
    { 
        id: 1, 
        org_id: 1,
        target: 'member',
        // FIX: Added missing properties to conform to Payout type.
        beneficiaryId: 'w-ghi-012',
        beneficiaryName: 'Mock Beneficiary 1',
        sourceId: 101,
        user_id: 'w-ghi-012',
        amount: 5000,
        amount_kobo: 500000,
        currency: 'NGN',
        status: 'settled', 
        approvals: 2, 
        provider: 'paystack',
        bank_account: { bank_code: '058', account_number: '...1234' },
        meta: {},
        updated_at: new Date(Date.now() - 86400000).toISOString(), 
        created_at: new Date(Date.now() - 86400000).toISOString(),
        settled_at: new Date(Date.now() - 86400000).toISOString(),
    },
    { 
        id: 2, 
        org_id: 1,
        target: 'member',
        // FIX: Added missing properties to conform to Payout type.
        beneficiaryId: 'w-mno-678',
        beneficiaryName: 'Mock Beneficiary 2',
        sourceId: 102,
        user_id: 'w-mno-678',
        amount: 1200,
        amount_kobo: 120000,
        currency: 'NGN',
        status: 'pending', 
        approvals: 1, 
        provider: 'paystack',
        bank_account: { bank_code: '044', account_number: '...5678' },
        meta: {},
        updated_at: new Date().toISOString(), 
        created_at: new Date().toISOString()
    },
    { 
        id: 3, 
        org_id: 1,
        target: 'member',
        // FIX: Added missing properties to conform to Payout type.
        beneficiaryId: 'w-stu-234',
        beneficiaryName: 'Mock Beneficiary 3',
        sourceId: 103,
        user_id: 'w-stu-234',
        amount: 750,
        amount_kobo: 75000,
        currency: 'NGN',
        status: 'failed', 
        approvals: 2, 
        provider: 'paystack',
        bank_account: { bank_code: '011', account_number: '...9012' },
        meta: {},
        updated_at: new Date(Date.now() - 3600000).toISOString(), 
        created_at: new Date(Date.now() - 3600000).toISOString()
    },
];

export async function getReconSummary(): Promise<ReconSummary> {
    console.log("MOCK: getReconSummary");
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        wallets: 150, // mock total wallets
        mismatches: mockMismatches,
    };
}

export async function getRecentPayouts(): Promise<Payout[]> {
    console.log("MOCK: getRecentPayouts");
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockPayouts;
}

export async function fixWalletMismatch(walletId: string): Promise<{ ok: boolean }> {
    console.log(`MOCK: fixWalletMismatch for ${walletId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    mockMismatches = mockMismatches.filter(m => m.wallet_id !== walletId);
    return { ok: true };
}