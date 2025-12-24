// services/settlementService.ts
import type { VGroupbuySupplierBalance, GroupbuySupplierSettlement, SupplierPayout } from '../types';
import { mockSupplierSettlements } from '../data/settlementMockData';
import { mockGroupBuys } from '../data/groupbuyMockData';
import { mockSuppliers } from '../data/supplierMockData';


let settlementsDb = [...mockSupplierSettlements];
let payoutsDb: SupplierPayout[] = [];

// Simulates fetching from the v_groupbuy_supplier_balance view
export async function getSettlementBalances(): Promise<VGroupbuySupplierBalance[]> {
    await new Promise(res => setTimeout(res, 500));

    // Re-compute the view on the fly from the mock DBs
    return settlementsDb.map(s => {
        const groupbuy = mockGroupBuys.find(gb => gb.id === s.groupbuy_id);
        const supplier = mockSuppliers.find(sup => sup.id === s.supplier_id);
        const total_adjustments = 0; // for mock
        const remaining_due = s.net_payable + total_adjustments - s.paid_amount;
        
        let status = s.status;
        if (remaining_due <= 0 && s.paid_amount > 0) {
            status = 'settled';
        } else if (s.paid_amount > 0 && remaining_due > 0) {
            status = 'partially_paid';
        } else {
            status = 'pending';
        }

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
            status,
            currency: s.currency,
            groupbuy_name: groupbuy?.name,
            supplier_name: supplier?.business_name
        };
    });
}

// Simulates compute_groupbuy_supplier_settlement RPC
export async function computeSettlement(groupbuyId: number, supplierId: number, feeBps: number = 200): Promise<GroupbuySupplierSettlement> {
    await new Promise(res => setTimeout(res, 800));
    
    const groupbuy = mockGroupBuys.find(gb => gb.id === groupbuyId);
    if (!groupbuy) throw new Error("GroupBuy not found");

    const existingSettlement = settlementsDb.find(s => s.groupbuy_id === groupbuyId && s.supplier_id === supplierId);
    if (existingSettlement) throw new Error("Settlement for this GroupBuy/Supplier already exists.");

    // Simplified calculation for mock
    const gross = (groupbuy.total_reserved_units || 0) * groupbuy.unit_price;
    const fee = Math.round(gross * feeBps / 10000.0);
    
    const newSettlement: GroupbuySupplierSettlement = {
        id: Date.now(),
        org_id: groupbuy.org_id,
        groupbuy_id: groupbuyId,
        supplier_id: supplierId,
        gross_amount: gross,
        platform_fee: fee,
        net_payable: gross - fee,
        paid_amount: 0,
        status: 'pending',
        currency: 'NGN',
        meta: { fee_bps: feeBps },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    settlementsDb.push(newSettlement);
    return newSettlement;
}

// Simulates issue_supplier_payout RPC
export async function issuePayout(settlementId: number, amount: number): Promise<SupplierPayout> {
    await new Promise(res => setTimeout(res, 1000));
    
    const settlement = settlementsDb.find(s => s.id === settlementId);
    if (!settlement) throw new Error("Settlement not found");

    const remaining_due = settlement.net_payable - settlement.paid_amount;
    if (amount > remaining_due) {
        throw new Error(`Amount ₦${amount.toLocaleString()} exceeds remaining due ₦${remaining_due.toLocaleString()}`);
    }

    // Update settlement
    settlement.paid_amount += amount;
    const new_remaining = settlement.net_payable - settlement.paid_amount;
    settlement.status = new_remaining <= 0 ? 'settled' : 'partially_paid';
    settlement.updated_at = new Date().toISOString();

    const newPayout: SupplierPayout = {
        id: Date.now(),
        org_id: settlement.org_id,
        settlement_id: settlementId,
        supplier_id: settlement.supplier_id,
        amount: amount,
        status: 'initiated', // We'll mock it as initiated -> settled quickly
        provider: 'paystack',
        provider_ref: `trf_mock_${Date.now()}`,
        created_at: new Date().toISOString(),
        meta: {},
    };
    payoutsDb.push(newPayout);
    
    // Simulate settlement
    setTimeout(() => {
        const p = payoutsDb.find(p => p.id === newPayout.id);
        if (p) {
            p.status = 'settled';
            p.settled_at = new Date().toISOString();
        }
    }, 2000);
    
    return newPayout;
}
