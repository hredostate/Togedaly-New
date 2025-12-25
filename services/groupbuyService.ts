import type { GroupBuy } from '../types';

let groupBuysDb: GroupBuy[] = [];

export async function getGroupBuys(): Promise<GroupBuy[]> {
    await new Promise(res => setTimeout(res, 400));
    // In a real app, you might join with groupbuy_orders to get total_reserved_units.
    return JSON.parse(JSON.stringify(groupBuysDb));
}

export async function upsertGroupBuy(groupBuy: Partial<GroupBuy>): Promise<GroupBuy> {
    await new Promise(res => setTimeout(res, 600));
    if (groupBuy.id) {
        const index = groupBuysDb.findIndex(gb => gb.id === groupBuy.id);
        if (index > -1) {
            groupBuysDb[index] = { ...groupBuysDb[index], ...groupBuy, updated_at: new Date().toISOString() };
            return groupBuysDb[index];
        }
    }
    
    // Create new
    const newGroupBuy: GroupBuy = {
        id: Date.now(),
        org_id: 1, // mock
        status: 'draft',
        min_units: 1,
        allow_oversubscribe: false,
        auto_cancel_if_under_min: true,
        visible: false,
        created_by: 'mock-admin-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...groupBuy,
    } as GroupBuy;
    
    groupBuysDb.unshift(newGroupBuy);
    return newGroupBuy;
}
