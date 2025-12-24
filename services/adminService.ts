
// services/adminService.ts

// FIX: Corrected imports. Aliased LegacyPool to Pool to match usage.
import type { KycDocument, AdminRiskEvent, AuditLog, LegacyPool as Pool, KycLevel, AdminActionRequest, AdminActionStatus, AdminUser, UserRole } from '../types';
// FIX: Corrected imports. Aliased mockLegacyPools to mockPools.
import { mockLegacyPools as mockPools } from '../data/mockData';
import { mockIncomingTransfers } from '../data/dvaMockData';
import { mockTreasuryPolicy } from '../data/treasuryMockData';
import { mockUserProfiles } from '../data/ajoMockData';
import { recordIdempotency } from './idempotencyService';
import { decideRoute } from './routingService';
import { logAdminAction, fetchAuditLogs } from './auditService';

// --- MOCK DATA ---
let mockKycQueue: KycDocument[] = [
    { id: 'doc-101', user_id: 'user-abc-123', doc_type: 'id_card', storage_path: '/kyc/user-abc-123/id.jpg', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'doc-102', user_id: 'user-def-456', doc_type: 'selfie', storage_path: '/kyc/user-def-456/selfie.jpg', status: 'pending', created_at: new Date(Date.now() - 172800000).toISOString() },
];

let mockRiskEvents: AdminRiskEvent[] = [
    { id: 'risk-1', user_id: 'user-xyz-789', source: 'system', code: 'velocity_user', severity: 'high', details: { count: 5 }, created_at: new Date().toISOString() },
    { id: 'risk-2', user_id: 'user-ghi-012', source: 'paystack', code: 'many_cards', severity: 'medium', details: { cards_used: 4 }, created_at: new Date(Date.now() - 3600000).toISOString() },
];

// Mock store for admin action requests
let mockActionRequests: AdminActionRequest[] = [
    {
        id: 101,
        org_id: 1,
        pool_id: '1',
        action_type: 'treasury_policy_update',
        target_table: 'pool_treasury_policy',
        target_id: '1',
        payload: { max_draw_pct: 0.55, kill_draws: true },
        status: 'pending',
        requested_by: 'admin-user-2', // Someone else
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
    }
];

// Mock Admin Users (extended from user profiles)
let adminUsers: AdminUser[] = mockUserProfiles.map((u, i) => ({
    ...u,
    role: i === 0 ? 'admin' : (i === 1 ? 'support' : (i === 2 ? 'manager' : 'member')),
    status: 'active',
    joined_at: new Date(Date.now() - (i+1) * 30 * 86400000).toISOString(),
}));

// --- MOCK SERVICE FUNCTIONS ---

export async function getKycQueue(): Promise<KycDocument[]> {
    console.log("MOCK: getKycQueue");
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockKycQueue;
}

export async function getPoolsForModeration(): Promise<Pool[]> {
     console.log("MOCK: getPoolsForModeration");
     await new Promise(resolve => setTimeout(resolve, 400));
     return mockPools.filter(p => p.is_active);
}

export async function getRiskEvents(): Promise<AdminRiskEvent[]> {
    console.log("MOCK: getRiskEvents");
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockRiskEvents;
}

export async function getAuditTrail(): Promise<AuditLog[]> {
    console.log("MOCK: getAuditTrail");
    return fetchAuditLogs();
}

export async function getUsers(): Promise<AdminUser[]> {
    console.log("MOCK: getUsers");
    await new Promise(resolve => setTimeout(resolve, 400));
    return [...adminUsers];
}

export async function updateUserRole(userId: string, newRole: UserRole, actorId: string): Promise<void> {
    console.log(`MOCK: updateUserRole ${userId} to ${newRole} by ${actorId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = adminUsers.find(u => u.id === userId);
    if (user) {
        const oldRole = user.role;
        user.role = newRole;
        await logAdminAction(actorId, 'user.update_role', `user:${userId}`, { oldRole, newRole });
    }
}

// --- ADMIN APPROVAL REQUESTS ---

export async function getAdminActionRequests(orgId: number): Promise<AdminActionRequest[]> {
    console.log("MOCK: getAdminActionRequests", orgId);
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockActionRequests.filter(r => r.org_id === orgId && r.status === 'pending');
}

export async function submitAdminActionRequest(
    orgId: number,
    poolId: string | undefined,
    actionType: string,
    targetTable: string,
    targetId: string,
    payload: any,
    actorId: string
): Promise<AdminActionRequest> {
    console.log("MOCK: submitAdminActionRequest", { actionType, payload });
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newReq: AdminActionRequest = {
        id: Date.now(),
        org_id: orgId,
        pool_id: poolId,
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        payload,
        status: 'pending',
        requested_by: actorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    mockActionRequests.unshift(newReq);
    return newReq;
}

export async function approveAdminActionRequest(requestId: number, actorId: string): Promise<void> {
    console.log("MOCK: approveAdminActionRequest", requestId);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const req = mockActionRequests.find(r => r.id === requestId);
    if (!req) throw new Error("Request not found");
    
    if (req.requested_by === actorId) {
        throw new Error("You cannot approve your own request.");
    }

    // Apply the change if it's a treasury update
    if (req.action_type === 'treasury_policy_update' && req.target_table === 'pool_treasury_policy') {
        // We mutate the imported mock object directly to simulate DB update
        Object.assign(mockTreasuryPolicy, req.payload);
        mockTreasuryPolicy.updated_at = new Date().toISOString();
    }

    req.status = 'approved';
    req.approved_by = actorId;
    req.updated_at = new Date().toISOString();
    
    await logAdminAction(actorId, 'request.approve', `req:${requestId}`, { action_type: req.action_type });
}

export async function rejectAdminActionRequest(requestId: number, reason: string, actorId: string): Promise<void> {
    console.log("MOCK: rejectAdminActionRequest", requestId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const req = mockActionRequests.find(r => r.id === requestId);
    if (!req) throw new Error("Request not found");

    req.status = 'rejected';
    req.reject_reason = reason;
    req.updated_at = new Date().toISOString();
    
    await logAdminAction(actorId, 'request.reject', `req:${requestId}`, { reason });
}


// --- MOCK ADMIN ACTIONS ---

export async function reviewKycDocument(docId: string, approve: boolean, newLevel: KycLevel | null, reason: string): Promise<void> {
    console.log(`MOCK: reviewKycDocument ${docId}`, { approve, newLevel, reason });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const doc = mockKycQueue.find(d => d.id === docId);
    if (!doc) throw new Error("Document not found");

    mockKycQueue = mockKycQueue.filter(d => d.id !== docId); // Remove from queue
    
    await logAdminAction('mock-admin-id', 'kyc.review', `doc:${docId}`, { approve, newLevel, reason });
}

export async function closePool(poolId: string, reason: string): Promise<void> {
    console.log(`MOCK: closePool ${poolId}`, { reason });
    await new Promise(resolve => setTimeout(resolve, 600));

    const pool = mockPools.find(p => p.id === poolId);
    if (!pool) throw new Error("Pool not found");
    // In a real app, you would mutate the state. Here we just log.
    
    await logAdminAction('mock-admin-id', 'pool.close', `pool:${poolId.slice(0,8)}`, { reason });
}

export async function refundPool(poolId: string, reason: string): Promise<void> {
    console.log(`MOCK: refundPool ${poolId}`, { reason });
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    await logAdminAction('mock-admin-id', 'pool.refund_all', `pool:${poolId.slice(0,8)}`, { reason });
}

export async function resolveRiskEvent(eventId: string, note: string): Promise<void> {
     console.log(`MOCK: resolveRiskEvent ${eventId}`, { note });
     await new Promise(resolve => setTimeout(resolve, 500));
     
     mockRiskEvents = mockRiskEvents.filter(e => e.id !== eventId);

     await logAdminAction('mock-admin-id', 'risk.resolve', `risk:${eventId}`, { note });
}

export async function checkEnvironment(): Promise<{ ok: boolean, results: { key: string, ok: boolean }[], warnings: string[] }> {
    console.log("MOCK: checkEnvironment");
    await new Promise(resolve => setTimeout(resolve, 300));
    // In a real app, this check would happen on the server. We simulate it here.
    const keys = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'API_KEY', // for Gemini
        'BULKSMS_NG_TOKEN',
        'MAIL_WEBHOOK_URL',
        'NEXT_PUBLIC_BASE_URL',
    ];

    // Simulate some missing keys for demonstration
    const mockEnv: Record<string, boolean> = {
        'NEXT_PUBLIC_SUPABASE_URL': true,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': true,
        'API_KEY': true,
        'BULKSMS_NG_TOKEN': false, // Missing
        'MAIL_WEBHOOK_URL': true,
        'NEXT_PUBLIC_BASE_URL': false, // Missing
    };

    const results = keys.map(key => ({
        key,
        ok: mockEnv[key] ?? false,
    }));

    const warnings = results.filter(r => !r.ok).map(r => `${r.key} is missing`);

    return {
        ok: warnings.length === 0,
        results,
        warnings,
    };
}

// --- RE-APPLY CREDIT FUNCTIONS ---

export async function getSkippedCredits(since?: string): Promise<any[]> {
    const allLogs = await fetchAuditLogs({ action: 'wallet.credit.skipped' });
    
    const audits = allLogs
        .filter(a => (a.meta?.reason === 'kill_switch' || a.meta?.details?.reason === 'kill_switch'))
        .filter(a => since ? new Date(a.created_at) >= new Date(since) : true);

    const items: any[] = [];
    for (const a of audits) {
        const txId = a.meta?.tx_id || a.meta?.details?.tx_id;
        if (!txId) continue;
        const it = mockIncomingTransfers.find(t => t.paystack_tx_id === txId);
        if (!it) continue;
        items.push({ when: a.created_at, user: it.user_id, amount_kobo: it.amount_kobo, narration: it.narration, paystack_tx_id: it.paystack_tx_id });
    }
    return items;
}

export async function reapplyCredit(tx_id: number): Promise<{ ok: boolean, skipped?: string }> {
    await new Promise(res => setTimeout(res, 800));
    const ok = await recordIdempotency('admin', 'reapply', String(tx_id));
    if (!ok) {
        return { ok: true, skipped: 'duplicate_reapply' };
    }

    const it = mockIncomingTransfers.find(t => t.paystack_tx_id === tx_id);
    if (!it) throw new Error('incoming_transfer_not_found');

    const route = await decideRoute(it.user_id, it.narration || '');

    console.log(`RE-APPLYING CREDIT: ₦${it.amount_kobo / 100} to ${route.dest} for user ${it.user_id}`);

    await logAdminAction('mock-admin-id', 'wallet.credit.reapplied', `user:${it.user_id}`, { tx_id, amount_kobo: it.amount_kobo, route });

    return { ok: true };
}

// --- BULK RE-APPLY ---
function enc(x:any){ return btoa(JSON.stringify(x)) }
function dec(x:string){ try{ return JSON.parse(atob(x)) }catch{ return null } }


export async function reapplyCreditBulk(
    since: string | undefined,
    limit: number = 100,
    dryRun: boolean = true,
    cursor?: string
): Promise<any> {
    console.log("MOCK: reapplyCreditBulk", { since, limit, dryRun, cursor });
    
    let audits = await fetchAuditLogs({ action: 'wallet.credit.skipped' });
    audits = audits
        .filter(a => (a.meta?.reason === 'kill_switch' || a.meta?.details?.reason === 'kill_switch'))
        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (since) {
        audits = audits.filter(a => new Date(a.created_at) >= new Date(since));
    }
    
    const cur = cursor ? dec(cursor) : null;
    if(cur?.created_at){
        audits = audits.filter(a => new Date(a.created_at) < new Date(cur.created_at));
    }

    const pageAudits = audits.slice(0, limit);

    const candidates: any[] = [];
    for (const a of pageAudits) {
        const txId = a.meta?.tx_id || a.meta?.details?.tx_id;
        if (!txId) continue;
        const it = mockIncomingTransfers.find(t => t.paystack_tx_id === txId);
        if (!it) continue;
        const route = await decideRoute(it.user_id, it.narration || '');
        candidates.push({ tx_id: txId, created_at: a.created_at, user_id: it.user_id, amount_kobo: it.amount_kobo, narration: it.narration, route });
    }
    
    const nextCursor = candidates.length > 0 ? enc({ created_at: candidates[candidates.length - 1].created_at }) : null;

    if (dryRun) {
        return { ok: true, dryRun: true, count: candidates.length, nextCursor, items: candidates };
    }

    const results: any[] = [];
    for (const c of candidates) {
        const ok = await recordIdempotency('admin', 'reapply', String(c.tx_id));
        if (!ok) {
            results.push({ tx_id: c.tx_id, status: 'skipped-duplicate' });
            continue;
        }
        // ... (simulate crediting logic)
        results.push({ tx_id: c.tx_id, status: 'ok' });
        await logAdminAction('mock-admin-id', 'wallet.credit.reapplied', `user:${c.user_id}`, { tx_id: c.tx_id, amount_kobo: c.amount_kobo, route: c.route, bulk: true });
    }

    return { ok: true, dryRun: false, processed: results.length, nextCursor, results };
}
