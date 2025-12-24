// data/settlementMockData.ts
import type { GroupbuySupplierSettlement, VGroupbuySupplierBalance, SupplierPayout, Supplier, Payout, SupplierInvoice, InvoicePayoutLink, ReconRun, ReconItem } from '../types';
import { mockGroupBuys } from './groupbuyMockData';
import { mockSuppliers as allSuppliers } from './supplierMockData';

const sallahCowSettlement: GroupbuySupplierSettlement = {
    id: 1,
    org_id: 1,
    groupbuy_id: 2, // Sallah Cow Share
    supplier_id: 2, // Babatunde Farms & Co.
    gross_amount: 850000,
    platform_fee: 17000, // 2%
    net_payable: 833000,
    paid_amount: 500000,
    status: 'partially_paid',
    currency: 'NGN',
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    settled_at: undefined,
    meta: { fee_bps: 200 }
};

const ramadanRiceSettlement: GroupbuySupplierSettlement = {
    id: 2,
    org_id: 1,
    groupbuy_id: 1, // Ramadan Rice
    supplier_id: 1, // Mama Chi Foods Ltd.
    gross_amount: 2170000, // 62 units * 35000
    platform_fee: 43400, // 2%
    net_payable: 2126600,
    paid_amount: 0,
    status: 'pending',
    currency: 'NGN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settled_at: undefined,
    meta: { fee_bps: 200 }
};

export const mockSupplierSettlements: GroupbuySupplierSettlement[] = [sallahCowSettlement, ramadanRiceSettlement];

export const mockSupplierPayouts: SupplierPayout[] = [
    {
        id: 1,
        org_id: 1,
        settlement_id: 1,
        supplier_id: 1,
        amount: 500000,
        status: 'settled',
        provider: 'paystack',
        provider_ref: 'trf_mock_settled_1',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        settled_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        meta: {}
    }
];

export const mockVGroupbuySupplierBalance: VGroupbuySupplierBalance[] = mockSupplierSettlements.map(s => {
    const groupbuy = mockGroupBuys.find(gb => gb.id === s.groupbuy_id);
    const supplier = allSuppliers.find(sup => sup.id === s.supplier_id);
    const total_adjustments = 0; // for mock
    const remaining_due = s.net_payable + total_adjustments - s.paid_amount;
    
    return {
        settlement_id: s.id,
        org_id: s.org_id,
        groupbuy_id: s.groupbuy_id,
        supplier_id: s.supplier_id,
        gross_amount: s.gross_amount,
        platform_fee: s.platform_fee,
        net_payable: s.net_payable,
        total_adjustments,
        paid_amount: s.paid_amount,
        remaining_due,
        status: s.status,
        currency: s.currency,
        groupbuy_name: groupbuy?.name,
        supplier_name: supplier?.business_name
    }
});

// FIX: Added missing mock data exports for disbursements and recon services.
export const mockPayouts: Payout[] = [
    {
        id: 101, org_id: 1, target: 'supplier', supplier_id: 1, amount: 500000, currency: 'NGN', status: 'settled', provider: 'paystack', provider_ref: 'trf_mock_settled_1',
        // FIX: Added missing properties to conform to Payout type.
        beneficiaryId: '1',
        beneficiaryName: 'Mama Chi Foods Ltd.',
        sourceId: 2, // Ramadan Rice settlement ID
        bank_account: {}, meta: {}, created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 102, org_id: 1, target: 'member', user_id: 'user-001', amount: 20000, currency: 'NGN', status: 'queued', provider: 'paystack',
        // FIX: Added missing properties to conform to Payout type.
        beneficiaryId: 'user-001',
        beneficiaryName: 'Adanna The GOAT',
        sourceId: 101, // Mock cycle ID
        bank_account: {}, meta: {}, created_at: new Date().toISOString(),
    }
];

export const mockSuppliers = allSuppliers;

export const mockSupplierInvoices: SupplierInvoice[] = [
    {
        id: 1, org_id: 1, groupbuy_id: 2, supplier_id: 2, invoice_number: 'INV-2024-001', gross_amount: 850000, discount_amount: 0, net_amount: 833000,
        vat_amount: 0, shipping_amount: 0, status: 'partially_paid', meta: {}, created_at: new Date(Date.now() - 9 * 86400000).toISOString()
    },
    {
        id: 2, org_id: 1, groupbuy_id: 1, supplier_id: 1, invoice_number: 'INV-2024-002', gross_amount: 2170000, discount_amount: 0, net_amount: 2126600,
        vat_amount: 0, shipping_amount: 0, status: 'sent', meta: {}, created_at: new Date().toISOString()
    }
];

export const mockInvoicePayoutLinks: InvoicePayoutLink[] = [
    { id: 1, invoice_id: 1, payout_id: 101, amount: 500000, created_at: new Date(Date.now() - 1 * 86400000).toISOString() }
];

export const mockReconRuns: ReconRun[] = [
    { id: 1, org_id: 1, status: 'completed', started_at: new Date(Date.now() - 86400000).toISOString(), ended_at: new Date(Date.now() - 86300000).toISOString() },
    { id: 2, org_id: 1, status: 'running', started_at: new Date().toISOString(), ended_at: '' }
];

export const mockReconItems: ReconItem[] = [
    { id: 101, run_id: 1, source: 'psp', external_ref: 'trf_123', amount: 50000000, currency: 'NGN', status: 'matched', meta: {} },
    { id: 102, run_id: 1, source: 'ledger', external_ref: 'trf_123', amount: -50000000, currency: 'NGN', status: 'matched', meta: {} },
    { id: 103, run_id: 2, source: 'psp', external_ref: 'trf_456', amount: 25000000, currency: 'NGN', status: 'pending', meta: {} },
    { id: 104, run_id: 2, source: 'bank', external_ref: 'BANK-REF-456', amount: 25000000, currency: 'NGN', status: 'pending', meta: {} },
];