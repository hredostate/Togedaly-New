
import type { Supplier, GroupBuy, FulfillmentStatus } from '../types';
import { mockSuppliers } from '../data/supplierMockData';
import { mockGroupBuys } from '../data/groupbuyMockData';

let suppliersDb = [...mockSuppliers];
let groupBuysDb = [...mockGroupBuys];

export async function getSuppliers(): Promise<Supplier[]> {
    await new Promise(res => setTimeout(res, 400));
    return JSON.parse(JSON.stringify(suppliersDb));
}

export async function upsertSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    await new Promise(res => setTimeout(res, 600));
    if (supplier.id) {
        const index = suppliersDb.findIndex(s => s.id === supplier.id);
        if (index > -1) {
            suppliersDb[index] = { ...suppliersDb[index], ...supplier, updated_at: new Date().toISOString() };
            return suppliersDb[index];
        }
    }
    
    // Create new (Admin context)
    const newSupplier: Supplier = {
        id: Date.now(),
        org_id: 1, // mock
        status: 'draft',
        rating_average: 0,
        rating_count: 0,
        meta: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        skus: [],
        logistics: {
            min_order_value_kobo: 0,
            lead_time_days: 2,
            delivery_areas: [],
            kyc_tier: 'basic'
        },
        ...supplier,
    } as Supplier;
    suppliersDb.unshift(newSupplier);
    return newSupplier;
}

/**
 * Public facing registration for new suppliers.
 * Security: Enforces 'submitted' status so Admins must verify.
 */
export async function registerSupplier(payload: {
    business_name: string;
    contact_person: string;
    phone: string;
    email: string;
    bank_code: string;
    account_number: string;
}): Promise<Supplier> {
    console.log("MOCK: registerSupplier", payload);
    await new Promise(res => setTimeout(res, 1000));

    const newSupplier: Supplier = {
        id: Date.now(),
        org_id: 1, // In real app, this links to the creating user
        business_name: payload.business_name,
        contact_person: payload.contact_person,
        phone: payload.phone,
        email: payload.email,
        bank_name: 'Pending Bank Resolution', // In real app, fetch from bank_code
        account_number: payload.account_number,
        status: 'submitted', // Secure default status
        rating_average: 0,
        rating_count: 0,
        meta: { bank_code: payload.bank_code },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        skus: [],
        logistics: {
            min_order_value_kobo: 0,
            lead_time_days: 7,
            delivery_areas: [],
            kyc_tier: 'basic'
        }
    };
    
    suppliersDb.unshift(newSupplier);
    return newSupplier;
}

// --- Logistics & Fulfillment ---

export async function getFulfillmentOrders(): Promise<GroupBuy[]> {
    await new Promise(res => setTimeout(res, 400));
    // Filter group buys that are in a state relevant to fulfillment
    return groupBuysDb.filter(gb => ['locked', 'fulfilling', 'completed', 'partially_refunded'].includes(gb.status));
}

export async function updateFulfillmentStatus(groupBuyId: number, status: FulfillmentStatus, unitsFulfilled?: number): Promise<void> {
    await new Promise(res => setTimeout(res, 600));
    const gb = groupBuysDb.find(g => g.id === groupBuyId);
    if (gb) {
        gb.fulfillment_status = status;
        if (unitsFulfilled !== undefined) {
            gb.units_fulfilled = unitsFulfilled;
        }
        gb.updated_at = new Date().toISOString();
    } else {
        throw new Error("GroupBuy not found");
    }
}

export async function uploadProofOfDelivery(groupBuyId: number, podUrl: string): Promise<void> {
    await new Promise(res => setTimeout(res, 800));
    const gb = groupBuysDb.find(g => g.id === groupBuyId);
    if (gb) {
        gb.pod_url = podUrl;
        gb.fulfillment_status = 'delivered';
        gb.updated_at = new Date().toISOString();
    } else {
        throw new Error("GroupBuy not found");
    }
}
