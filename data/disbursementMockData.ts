// data/disbursementMockData.ts
import type { PayoutRecipient, CyclePayout, SupplierPayout } from '../types';
import { mockUserProfiles } from './ajoMockData';
import { mockSuppliers } from './supplierMockData';

export const mockPayoutRecipients: PayoutRecipient[] = [
    {
        id: 1,
        org_id: 1,
        user_id: mockUserProfiles[0].id, // Adanna
        provider: 'paystack',
        recipient_code: 'RCP_mockuser_adanna',
        currency: 'NGN',
        bank_code: '058',
        account_number: '...1111',
        account_name: 'ADANNA THE GOAT',
        meta: {},
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        org_id: 1,
        supplier_id: mockSuppliers[0].id, // Mama Chi Foods
        provider: 'paystack',
        recipient_code: 'RCP_mocksupplier_mamachi',
        currency: 'NGN',
        bank_code: '011',
        account_number: '...2222',
        account_name: 'MAMA CHI FOODS LTD',
        meta: {},
        created_at: new Date().toISOString()
    }
];

export const mockCyclePayouts: CyclePayout[] = [
    {
        id: 101,
        pool_id: 1,
        cycle_id: 3,
        rotation_position: 3,
        beneficiary_user_id: mockUserProfiles[2].id, // Chioma
        amount: 240000,
        status: 'pending',
        meta: { reason: 'cycle_payout' },
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 102,
        pool_id: 1,
        cycle_id: 2,
        rotation_position: 2,
        beneficiary_user_id: mockUserProfiles[1].id, // Tunde
        amount: 240000,
        status: 'settled',
        provider: 'paystack',
        provider_ref: 'trf_mock_cycle_tunde',
        receipt_url: '#',
        settled_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        meta: { reason: 'cycle_payout' },
        created_at: new Date(Date.now() - 7 * 86400000 - 3600000).toISOString(),
        receipt_file_path: 'receipts/psp/cycle-102.pdf',
        receipt_source: 'psp',
    }
];

export const mockSupplierPayouts: SupplierPayout[] = [
    {
        id: 201,
        org_id: 1,
        settlement_id: 2, // Ramadan Rice
        supplier_id: mockSuppliers[0].id, // Mama Chi Foods
        amount: 2126600,
        status: 'pending',
        // FIX: Added missing 'provider' property to satisfy the SupplierPayout type.
        provider: 'paystack',
        meta: {},
        created_at: new Date().toISOString(),
    },
    {
        id: 202,
        org_id: 1,
        settlement_id: 1, // Sallah Cow
        supplier_id: mockSuppliers[1].id, // Babatunde Farms
        amount: 500000,
        status: 'settled',
        provider: 'paystack',
        provider_ref: 'trf_mock_supplier_baba',
        receipt_url: '#',
        settled_at: new Date(Date.now() - 86400000).toISOString(),
        meta: {},
        created_at: new Date(Date.now() - 86400000 - 1800000).toISOString(),
    }
];
