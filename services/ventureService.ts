
import type { LegacyPool } from '../types';

let legacyPools: LegacyPool[] = [];

export async function getVentures(filter?: string): Promise<LegacyPool[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let data = [...legacyPools];
    if (filter) {
        data = data.filter(v => v.poolType === filter);
    }
    return data;
}

export async function getVentureById(id: string): Promise<LegacyPool | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return legacyPools.find(v => v.id === id) || null;
}

export async function createVenture(venture: Partial<LegacyPool>): Promise<LegacyPool> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newVenture = {
        ...venture,
        id: `venture-${Date.now()}`,
        created_at: new Date().toISOString(),
        raised_amount_kobo: 0,
        milestones: [],
    } as LegacyPool;
    return newVenture;
}
