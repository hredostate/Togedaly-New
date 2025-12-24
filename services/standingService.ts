import type { Dispute, DisputeStatus, DefaultEvent } from '../types';
import { mockDisputes, mockDefaultEvents } from '../data/standingMockData';

let disputesDb = [...mockDisputes];
let defaultsDb = [...mockDefaultEvents];

// --- USER-FACING ---
export async function getUserDisputes(): Promise<Dispute[]> {
    console.log("MOCK: getUserDisputes");
    await new Promise(res => setTimeout(res, 400));
    return disputesDb.filter(d => d.user_id === 'mock-user-id');
}

export async function createUserDispute(payload: Omit<Dispute, 'id'|'user_id'|'org_id'|'status'|'created_at'|'updated_at'>): Promise<Dispute> {
    console.log("MOCK: createUserDispute", payload);
    await new Promise(res => setTimeout(res, 600));
    const newDispute: Dispute = {
        id: `disp-${Date.now()}`,
        user_id: 'mock-user-id',
        org_id: 1,
        status: 'open',
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    disputesDb.unshift(newDispute);
    return newDispute;
}

export async function getUserDefaultEvents(): Promise<DefaultEvent[]> {
    console.log("MOCK: getUserDefaultEvents");
    await new Promise(res => setTimeout(res, 300));
    return defaultsDb.filter(d => d.user_id === 'mock-user-id');
}


// --- ADMIN-FACING ---
export async function getAdminDisputes(filters: { status: DisputeStatus | 'all' }): Promise<Dispute[]> {
    console.log("MOCK: getAdminDisputes", filters);
    await new Promise(res => setTimeout(res, 500));
    if (filters.status === 'all') {
        return [...disputesDb].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return disputesDb.filter(d => d.status === filters.status);
}

export async function updateAdminDispute(disputeId: string, updates: { status?: DisputeStatus, admin_note?: string }): Promise<Dispute> {
    console.log("MOCK: updateAdminDispute", disputeId, updates);
    await new Promise(res => setTimeout(res, 700));
    const dispute = disputesDb.find(d => d.id === disputeId);
    if (!dispute) throw new Error("Dispute not found");

    if (updates.status) {
        dispute.status = updates.status;
    }
    if (updates.admin_note) {
        dispute.meta = { ...dispute.meta, admin_note: updates.admin_note };
    }
    dispute.updated_at = new Date().toISOString();
    
    return { ...dispute };
}
