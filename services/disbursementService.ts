// services/disbursementService.ts
import type { Payout, PayoutRecipient, InvoicePayoutLink } from '../types';
import { mockCyclePayouts, mockSupplierPayouts, mockPayoutRecipients } from '../data/disbursementMockData';
import { mockUserProfiles } from '../data/ajoMockData';
import { mockSuppliers } from '../data/supplierMockData';
import { getBanks } from './bankService';
import { mockInvoicePayoutLinks } from '../data/settlementMockData';

// Mock DBs
let recipientsDb = [...mockPayoutRecipients];
let cyclePayoutsDb = [...mockCyclePayouts];
let supplierPayoutsDb = [...mockSupplierPayouts];

export async function getPendingPayouts(): Promise<Payout[]> {
    await new Promise(res => setTimeout(res, 500));
    
    const pendingCyclePayouts = cyclePayoutsDb.filter(p => p.status === 'pending');
    const pendingSupplierPayouts = supplierPayoutsDb.filter(p => p.status === 'pending');

    const mappedCyclePayouts: Payout[] = pendingCyclePayouts.map(p => {
        const beneficiary = mockUserProfiles.find(u => u.id === p.beneficiary_user_id);
        return {
            id: p.id,
            org_id: 1,
            pool_id: String(p.pool_id),
            target: 'cycle',
            sourceId: p.cycle_id,
            beneficiaryId: p.beneficiary_user_id,
            beneficiaryName: beneficiary?.name || p.beneficiary_user_id,
            amount: p.amount,
            currency: 'NGN',
            status: p.status,
            provider: 'paystack',
            meta: p.meta,
            created_at: p.created_at,
            receipt_file_path: p.receipt_file_path,
            receipt_source: p.receipt_source,
        } as Payout;
    });

    const mappedSupplierPayouts: Payout[] = pendingSupplierPayouts.map(p => {
        const beneficiary = mockSuppliers.find(s => s.id === p.supplier_id);
        return {
            id: p.id,
            org_id: p.org_id,
            target: 'settlement',
            sourceId: p.settlement_id,
            beneficiaryId: String(p.supplier_id),
            beneficiaryName: beneficiary?.business_name || `Supplier #${p.supplier_id}`,
            amount: p.amount,
            currency: 'NGN',
            status: p.status,
            provider: 'paystack',
            meta: p.meta,
            created_at: p.created_at,
            receipt_file_path: p.receipt_file_path,
            receipt_source: p.receipt_source,
        } as Payout;
    });

    return [...mappedCyclePayouts, ...mappedSupplierPayouts].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function getPayoutRecipients(): Promise<PayoutRecipient[]> {
    await new Promise(res => setTimeout(res, 300));
    return [...recipientsDb];
}

export async function createPayoutRecipient(
    payload: { type: 'user' | 'supplier'; id: string; bank_code: string; account_number: string; }
): Promise<PayoutRecipient> {
    await new Promise(res => setTimeout(res, 800));

    // Simulate Paystack recipient creation and account name resolution
    const banks = await getBanks();
    const bank = banks.find(b => b.code === payload.bank_code);
    if (!bank) throw new Error("Invalid bank code");

    let account_name = 'MOCK ACCOUNT NAME';
    if (payload.type === 'user') {
        const user = mockUserProfiles.find(u => u.id === payload.id);
        if (!user) throw new Error("User not found");
        account_name = user.name.toUpperCase();
    } else {
        const supplier = mockSuppliers.find(s => s.id === Number(payload.id));
        if (!supplier) throw new Error("Supplier not found");
        account_name = supplier.business_name.toUpperCase();
    }
    
    const newRecipient: PayoutRecipient = {
        id: Date.now(),
        org_id: 1,
        user_id: payload.type === 'user' ? payload.id : undefined,
        supplier_id: payload.type === 'supplier' ? Number(payload.id) : undefined,
        provider: 'paystack',
        recipient_code: `RCP_mock_${Date.now()}`,
        currency: 'NGN',
        bank_code: payload.bank_code,
        account_number: payload.account_number,
        account_name,
        meta: {},
        created_at: new Date().toISOString()
    };
    
    recipientsDb.push(newRecipient);
    return newRecipient;
}

export async function processPayout(payoutId: number, type: 'cycle' | 'settlement'): Promise<void> {
    await new Promise(res => setTimeout(res, 1200));
    
    const db = type === 'cycle' ? cyclePayoutsDb : supplierPayoutsDb;
    const payout = db.find(p => p.id === payoutId);
    
    if (!payout) throw new Error("Payout not found");
    if (payout.status !== 'pending') throw new Error("Payout is not in a pending state");

    // Simulate processing
    payout.status = 'settled';
    payout.provider_ref = `trf_mock_${type}_${payout.id}`;
    payout.settled_at = new Date().toISOString();
    payout.receipt_url = '#mock-receipt';
    payout.psp_meta = { message: 'Transfer successful' };
}

export async function uploadReceipt(payoutId: number, type: 'cycle' | 'settlement', { filePath, url }: { filePath: string; url?: string }): Promise<void> {
    await new Promise(res => setTimeout(res, 800));
    console.log('MOCK: uploadReceipt', { payoutId, type, filePath, url });
    
    const db = type === 'cycle' ? cyclePayoutsDb : supplierPayoutsDb;
    const payout = db.find(p => p.id === payoutId);
    
    if (!payout) throw new Error("Payout not found");
    
    payout.receipt_file_path = filePath;
    payout.receipt_url = url;
    payout.receipt_source = 'manual';
}


// FIX: Added missing export for queuePayout
export async function queuePayout(payload: Partial<Payout>): Promise<Payout> {
    await new Promise(res => setTimeout(res, 500));
    console.log("MOCK: queuePayout", payload);
    
    const newPayout = {
        id: Date.now(),
        org_id: payload.org_id || 1,
        target: payload.target || 'member',
        beneficiaryId: payload.beneficiaryId || 'unknown',
        beneficiaryName: payload.beneficiaryName || 'Unknown',
        sourceId: payload.sourceId || 0,
        amount: payload.amount || 0,
        currency: 'NGN',
        status: 'queued',
        provider: 'paystack',
        meta: payload.meta || {},
        created_at: new Date().toISOString(),
        ...payload
    } as Payout;

    if (newPayout.target === 'cycle') {
        cyclePayoutsDb.push(newPayout as any); 
    } else {
        supplierPayoutsDb.push(newPayout as any);
    }
    
    return newPayout;
}

// FIX: Added missing export for linkPayoutToInvoice
export async function linkPayoutToInvoice(invoiceId: number, payoutId: number, amount: number): Promise<void> {
    await new Promise(res => setTimeout(res, 300));
    console.log("MOCK: linkPayoutToInvoice", { invoiceId, payoutId, amount });
    
    const newLink: InvoicePayoutLink = {
        id: Date.now(),
        invoice_id: invoiceId,
        payout_id: payoutId,
        amount: amount,
        created_at: new Date().toISOString()
    };
    
    mockInvoicePayoutLinks.push(newLink);
}