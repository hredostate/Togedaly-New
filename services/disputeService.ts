
import type { Dispute } from '../types';

let disputesDb: Dispute[] = [];

export async function getDisputes(): Promise<Dispute[]> {
    await new Promise(res => setTimeout(res, 400));
    return disputesDb;
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
    await new Promise(res => setTimeout(res, 200));
    return disputesDb.find(d => d.id === id) || null;
}

export async function createDispute(data: Partial<Dispute>): Promise<Dispute> {
    await new Promise(res => setTimeout(res, 600));
    const newDispute: Dispute = {
        id: `disp-${Date.now()}`,
        user_id: 'mock-user-id',
        org_id: 1,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data
    } as Dispute;
    disputesDb.unshift(newDispute);
    return newDispute;
}

export async function resolveDispute(id: string, resolution: string): Promise<void> {
    await new Promise(res => setTimeout(res, 500));
    const idx = disputesDb.findIndex(d => d.id === id);
    if (idx > -1) {
        disputesDb[idx].status = 'resolved';
        disputesDb[idx].meta = { ...disputesDb[idx].meta, resolution };
    }
}
