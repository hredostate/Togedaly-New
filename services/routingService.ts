
// services/routingService.ts
// FIX: Aliased LegacyPool to Pool.
import type { WalletRoutingPrefs, LegacyPool as Pool, PoolType } from '../types';
// FIX: Aliased mockLegacyPools to mockPools.
import { mockLegacyPools as mockPools } from '../data/mockData';
import { fetchAuditLogs } from './auditService';

export type RouteDecision = { dest: 'wallet' | 'ajo' | 'group_buy' | 'invest', id?: string | null, reason: string };

// MOCK in-memory database for user routing preferences
let mockRoutingPrefs: WalletRoutingPrefs[] = [
    {
        user_id: 'mock-user-id',
        default_destination: 'ajo',
        default_destination_id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01', // Community Ajo Savings
        memo_overrides: {
            "GROUP-COWSHARE": { dest: 'group_buy', id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0' }
        },
        updated_at: new Date().toISOString()
    }
];


/**
 * Parses a bank transfer narration/memo to find a routing hint.
 * e.g., "AJO:LEKKI-COW-DEC" -> { tag: 'AJO', ref: 'LEKKI-COW-DEC' }
 */
export function parseNarration(narration: string | null | undefined): { tag: string; ref: string } | null {
  const raw = (narration || '').trim().toUpperCase();
  const m = raw.match(/^(AJO|GROUP|INVEST)[:\-\s]([A-Z0-9\-]+)/);
  if (!m) return null;
  return { tag: m[1], ref: m[2] };
}

/**
 * Decides the destination for an incoming DVA transfer based on narration and user preferences.
 */
export async function decideRoute(user_id: string, narration: string): Promise<RouteDecision> {
    const hint = parseNarration(narration);
    const prefs = mockRoutingPrefs.find(p => p.user_id === user_id);

    if (hint && prefs?.memo_overrides) {
        const key = `${hint.tag}-${hint.ref}`;
        const override = prefs.memo_overrides[key];
        if (override) {
            return { dest: override.dest as any, id: override.id, reason: `memo_override ('${key}')` };
        }
    }
    
    const narrationKey = (narration || '').trim().toUpperCase().replace(/\s+/g, '-');
    if (narrationKey && prefs?.memo_overrides) {
        const override = prefs.memo_overrides[narrationKey];
        if (override) {
            return { dest: override.dest as any, id: override.id, reason: `memo_override ('${narrationKey}')` };
        }
    }

    if (hint) {
        const destMap: Record<string, RouteDecision['dest']> = { 'AJO': 'ajo', 'GROUP': 'group_buy', 'INVEST': 'invest' };
        if (destMap[hint.tag]) {
            return { dest: destMap[hint.tag], id: null, reason: `memo_tag ('${hint.tag}')` };
        }
    }

    if (prefs?.default_destination && prefs.default_destination !== 'wallet') {
        return { dest: prefs.default_destination, id: prefs.default_destination_id, reason: 'user_default' };
    }

    return { dest: 'wallet', id: null, reason: 'default_to_wallet' };
}

/**
 * Fetches routing preferences for a specific user (for admin panel).
 */
export async function getRoutingPrefs(userId: string): Promise<WalletRoutingPrefs | null> {
    console.log("MOCK: getRoutingPrefs for", userId);
    await new Promise(res => setTimeout(res, 300));
    const prefs = mockRoutingPrefs.find(p => p.user_id === userId);
    // Return a copy to avoid accidental mutation in the UI
    return prefs ? JSON.parse(JSON.stringify(prefs)) : null;
}

/**
 * Updates routing preferences for a specific user (for admin panel).
 */
export async function updateRoutingPrefs(userId: string, prefs: Partial<WalletRoutingPrefs>): Promise<WalletRoutingPrefs> {
    console.log("MOCK: updateRoutingPrefs for", userId, prefs);
    await new Promise(res => setTimeout(res, 500));
    
    let existing = mockRoutingPrefs.find(p => p.user_id === userId);
    if (existing) {
        Object.assign(existing, prefs, { updated_at: new Date().toISOString() });
    } else {
        existing = {
            user_id: userId,
            default_destination: 'wallet',
            ...prefs,
            updated_at: new Date().toISOString(),
        };
        mockRoutingPrefs.push(existing);
    }
    return existing;
}

/**
 * Creates a new memo override for a user.
 */
export async function createMemoOverride(user_id: string, narration: string, dest: RouteDecision['dest'], id: string | null): Promise<void> {
    await new Promise(res => setTimeout(res, 500));
    const key = String(narration).trim().toUpperCase().replace(/\s+/g, '-');
    if (!key) throw new Error("Narration cannot be empty.");

    let userPrefs = mockRoutingPrefs.find(p => p.user_id === user_id);
    if (!userPrefs) {
        userPrefs = { user_id, default_destination: 'wallet', memo_overrides: {}, updated_at: new Date().toISOString() };
        mockRoutingPrefs.push(userPrefs);
    }

    if (!userPrefs.memo_overrides) {
        userPrefs.memo_overrides = {};
    }

    userPrefs.memo_overrides[key] = { dest, id: id || '' };
    userPrefs.updated_at = new Date().toISOString();

    console.log(`MOCK: Created override for user ${user_id}. Key: ${key}, Value:`, userPrefs.memo_overrides[key]);
}

/**
 * Creates multiple memo overrides from all unrouted transactions, with a dry-run option.
 */
export async function createBulkMemoOverrides(
    since: string | undefined,
    dest: RouteDecision['dest'],
    dest_id: string | null,
    dryRun: boolean = false,
    bank?: string,
    min_amount?: number
): Promise<{ created?: number, users?: any[] }> {
    await new Promise(res => setTimeout(res, 1200));
    
    const logs = await fetchAuditLogs({ action: 'routing.apply' });
    let filteredLogs = logs;
    if (since) {
        filteredLogs = filteredLogs.filter(log => new Date(log.created_at) >= new Date(since));
    }
    
    const unrouted = filteredLogs
        .filter(r => r.meta?.route?.reason === 'default_to_wallet')
        .filter(r => {
            const nar = String(r.meta?.route?.narration || '');
            const amt = (r.meta?.amount_kobo || 0) / 100;
            const bankOk = !bank || nar.toLowerCase().includes(bank.toLowerCase());
            const amtOk = !min_amount || amt >= min_amount;
            return bankOk && amtOk;
        });
    
    const grouped = new Map<string, { user: string, narration: string, total: number }>();
    for (const r of unrouted) {
        const user = String(r.target || '').replace(/^user:/i, '');
        const narration = String(r.meta?.route?.narration || '').trim().toUpperCase().replace(/\s+/g, '-');
        if (!user || !narration) continue;
        const key = `${user}|${narration}`;
        const amt = (r.meta?.amount_kobo || 0) / 100;
        if (!grouped.has(key)) grouped.set(key, { user, narration, total: 0 });
        const g = grouped.get(key)!;
        g.total += amt;
    }

    if (dryRun) {
        const perUser = new Map<string, { user: string, count: number, total: number, rows: { narration: string, total: number }[] }>();
        for (const { user, narration, total } of grouped.values()) {
            if (!perUser.has(user)) perUser.set(user, { user, count: 0, total: 0, rows: [] });
            const u = perUser.get(user)!;
            u.count++;
            u.total += total;
            if (u.rows.length < 5) u.rows.push({ narration, total });
        }
        const users = Array.from(perUser.values()).sort((a, b) => b.total - a.total);
        return { users };
    }
    
    let count = 0;
    for (const { user, narration } of grouped.values()) {
        try {
            await createMemoOverride(user, narration, dest, dest_id);
            count++;
        } catch (e) {
            console.error(`Failed to create bulk override for ${user} - ${narration}`, e);
        }
    }
    
    return { created: count };
}
