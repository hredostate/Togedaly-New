
// services/adminService.ts

import type { KycDocument, AdminRiskEvent, AuditLog, LegacyPool as Pool, KycLevel, AdminActionRequest, AdminActionStatus, AdminUser, UserRole, UserProfile, IncomingTransfer, PoolTreasuryPolicy } from '../types';
import { recordIdempotency } from './idempotencyService';
import { decideRoute } from './routingService';
import { logAdminAction, fetchAuditLogs } from './auditService';
import { supabase } from '../supabaseClient';

// --- REAL DATABASE SERVICE FUNCTIONS ---

// --- REAL DATABASE SERVICE FUNCTIONS ---

// ============================================================================
// KYC QUEUE FUNCTIONS
// ============================================================================

export async function getKycQueue(): Promise<KycDocument[]> {
    const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as KycDocument[];
}

export async function approveKycDocument(docId: string, actorId: string): Promise<void> {
    const { error } = await supabase
        .from('kyc_documents')
        .update({
            status: 'approved',
            reviewed_by: actorId,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', docId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'kyc.approve', `doc:${docId}`, {});
}

export async function rejectKycDocument(docId: string, reason: string, actorId: string): Promise<void> {
    const { error } = await supabase
        .from('kyc_documents')
        .update({
            status: 'rejected',
            reviewed_by: actorId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason
        })
        .eq('id', docId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'kyc.reject', `doc:${docId}`, { reason });
}

export async function reviewKycDocument(docId: string, approve: boolean, newLevel: KycLevel | null, reason: string): Promise<void> {
    if (approve && newLevel) {
        await approveKycDocument(docId, 'mock-admin-id');
        // Also update user's KYC level in profiles
        const doc = await supabase.from('kyc_documents').select('user_id').eq('id', docId).single();
        if (doc.data) {
            await supabase.from('profiles').update({ kyc_level: newLevel }).eq('id', doc.data.user_id);
        }
    } else {
        await rejectKycDocument(docId, reason, 'mock-admin-id');
    }
}


// ============================================================================
// POOL MANAGEMENT FUNCTIONS
// ============================================================================

export async function getPoolsForModeration(): Promise<Pool[]> {
    const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Pool[];
}

export async function updatePoolStatus(poolId: string, isActive: boolean, actorId: string): Promise<void> {
    const { error } = await supabase
        .from('pools')
        .update({ is_active: isActive })
        .eq('id', poolId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'pool.update_status', `pool:${poolId}`, { isActive });
}

export async function closePool(poolId: string, reason: string): Promise<void> {
    const { error } = await supabase
        .from('pools')
        .update({ is_active: false })
        .eq('id', poolId);
    
    if (error) throw error;
    await logAdminAction('mock-admin-id', 'pool.close', `pool:${poolId.slice(0,8)}`, { reason });
}

export async function refundPool(poolId: string, reason: string): Promise<void> {
    // In a real implementation, this would trigger refund transactions
    await logAdminAction('mock-admin-id', 'pool.refund_all', `pool:${poolId.slice(0,8)}`, { reason });
}


// ============================================================================
// RISK EVENTS FUNCTIONS
// ============================================================================

export async function getRiskEvents(filters?: { resolved?: boolean; severity?: string }): Promise<AdminRiskEvent[]> {
    let query = supabase.from('risk_events').select('*');
    
    if (filters?.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved);
    }
    if (filters?.severity) {
        query = query.eq('severity', filters.severity);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as AdminRiskEvent[];
}

export async function createRiskEvent(event: Omit<AdminRiskEvent, 'id' | 'created_at'>): Promise<AdminRiskEvent> {
    const { data, error } = await supabase
        .from('risk_events')
        .insert(event)
        .select()
        .single();
    
    if (error) throw error;
    return data as AdminRiskEvent;
}

export async function resolveRiskEvent(eventId: string, note: string, actorId: string = 'mock-admin-id'): Promise<void> {
    const { error } = await supabase
        .from('risk_events')
        .update({
            resolved: true,
            resolved_by: actorId,
            resolved_at: new Date().toISOString(),
            resolution_note: note
        })
        .eq('id', eventId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'risk.resolve', `risk:${eventId}`, { note });
}


// ============================================================================
// AUDIT TRAIL
// ============================================================================

export async function getAuditTrail(): Promise<AuditLog[]> {
    return fetchAuditLogs();
}


// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

export async function getUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, status, created_at, phone')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map profiles to AdminUser format
    return (data || []).map(profile => ({
        ...profile,
        joined_at: profile.created_at
    })) as AdminUser[];
}

export async function createUser(user: Partial<AdminUser>): Promise<AdminUser> {
    // Note: Creating users requires Supabase Auth API
    // This is a placeholder for the actual implementation
    throw new Error('User creation should be done through Supabase Auth API');
}

export async function updateUserRole(userId: string, newRole: UserRole, actorId: string): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'user.update_role', `user:${userId}`, { newRole });
}

export async function deleteUser(userId: string, actorId: string): Promise<void> {
    // Soft delete - set status to inactive
    const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', userId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'user.delete', `user:${userId}`, {});
}


// ============================================================================
// ADMIN APPROVAL REQUESTS (Maker-Checker Pattern)
// ============================================================================

export async function getAdminActionRequests(orgId: number, status?: AdminActionStatus): Promise<AdminActionRequest[]> {
    let query = supabase
        .from('admin_action_requests')
        .select('*')
        .eq('org_id', orgId);
    
    if (status) {
        query = query.eq('status', status);
    } else {
        query = query.eq('status', 'pending');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as AdminActionRequest[];
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
    const newReq = {
        org_id: orgId,
        pool_id: poolId,
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        payload,
        status: 'pending' as AdminActionStatus,
        requested_by: actorId,
    };
    
    const { data, error } = await supabase
        .from('admin_action_requests')
        .insert(newReq)
        .select()
        .single();
    
    if (error) throw error;
    return data as AdminActionRequest;
}

export async function approveAdminActionRequest(requestId: number, actorId: string): Promise<void> {
    // First, get the request
    const { data: req, error: fetchError } = await supabase
        .from('admin_action_requests')
        .select('*')
        .eq('id', requestId)
        .single();
    
    if (fetchError) throw fetchError;
    if (!req) throw new Error("Request not found");
    
    if (req.requested_by === actorId) {
        throw new Error("You cannot approve your own request.");
    }

    // Apply the change if it's a treasury update
    if (req.action_type === 'treasury_policy_update' && req.target_table === 'pool_treasury_policy') {
        const poolId = req.target_id;
        
        // Check if policy exists
        const { data: existing } = await supabase
            .from('pool_treasury_policies')
            .select('*')
            .eq('pool_id', poolId)
            .single();
        
        if (existing) {
            // Update existing policy
            await supabase
                .from('pool_treasury_policies')
                .update({ ...req.payload, updated_at: new Date().toISOString() })
                .eq('pool_id', poolId);
        } else {
            // Create new policy
            await supabase
                .from('pool_treasury_policies')
                .insert({ pool_id: poolId, ...req.payload });
        }
    }

    // Update the request status
    const { error } = await supabase
        .from('admin_action_requests')
        .update({
            status: 'approved',
            approved_by: actorId,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'request.approve', `req:${requestId}`, { action_type: req.action_type });
}

export async function rejectAdminActionRequest(requestId: number, reason: string, actorId: string): Promise<void> {
    const { error } = await supabase
        .from('admin_action_requests')
        .update({
            status: 'rejected',
            reject_reason: reason,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
    
    if (error) throw error;
    await logAdminAction(actorId, 'request.reject', `req:${requestId}`, { reason });
}


// ============================================================================
// ENVIRONMENT CHECK
// ============================================================================

export async function checkEnvironment(): Promise<{ ok: boolean, results: { key: string, ok: boolean }[], warnings: string[] }> {
    // This check should ideally happen on the server
    const keys = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'API_KEY',
        'BULKSMS_NG_TOKEN',
        'MAIL_WEBHOOK_URL',
        'NEXT_PUBLIC_BASE_URL',
    ];

    // Check environment variables
    const results = keys.map(key => ({
        key,
        ok: !!(import.meta.env[key] || process.env[key]),
    }));

    const warnings = results.filter(r => !r.ok).map(r => `${r.key} is missing`);

    return {
        ok: warnings.length === 0,
        results,
        warnings,
    };
}


// ============================================================================
// CREDIT REAPPLY FUNCTIONS
// ============================================================================

export async function getSkippedCredits(since?: string): Promise<any[]> {
    const allLogs = await fetchAuditLogs({ action: 'wallet.credit.skipped' });
    
    const audits = allLogs
        .filter(a => (a.meta?.reason === 'kill_switch' || a.meta?.details?.reason === 'kill_switch'))
        .filter(a => since ? new Date(a.created_at) >= new Date(since) : true);

    const items: any[] = [];
    for (const a of audits) {
        const txId = a.meta?.tx_id || a.meta?.details?.tx_id;
        if (!txId) continue;
        
        // Fetch the transfer from database
        const { data: transfer } = await supabase
            .from('incoming_transfers')
            .select('*')
            .eq('paystack_tx_id', txId)
            .single();
            
        if (!transfer) continue;
        items.push({ 
            when: a.created_at, 
            user: transfer.user_id, 
            amount_kobo: transfer.amount_kobo, 
            narration: transfer.narration, 
            paystack_tx_id: transfer.paystack_tx_id 
        });
    }
    return items;
}

export async function reapplyCredit(tx_id: number): Promise<{ ok: boolean, skipped?: string }> {
    const ok = await recordIdempotency('admin', 'reapply', String(tx_id));
    if (!ok) {
        return { ok: true, skipped: 'duplicate_reapply' };
    }

    const { data: transfer, error } = await supabase
        .from('incoming_transfers')
        .select('*')
        .eq('paystack_tx_id', tx_id)
        .single();
        
    if (error || !transfer) throw new Error('incoming_transfer_not_found');

    const route = await decideRoute(transfer.user_id, transfer.narration || '');

    console.log(`RE-APPLYING CREDIT: ₦${transfer.amount_kobo / 100} to ${route.dest} for user ${transfer.user_id}`);

    await logAdminAction('mock-admin-id', 'wallet.credit.reapplied', `user:${transfer.user_id}`, { 
        tx_id, 
        amount_kobo: transfer.amount_kobo, 
        route 
    });

    return { ok: true };
}

// Helper functions for bulk reapply
function enc(x: any) { return btoa(JSON.stringify(x)) }
function dec(x: string) { try { return JSON.parse(atob(x)) } catch { return null } }

export async function reapplyCreditBulk(
    since: string | undefined,
    limit: number = 100,
    dryRun: boolean = true,
    cursor?: string
): Promise<any> {
    let audits = await fetchAuditLogs({ action: 'wallet.credit.skipped' });
    audits = audits
        .filter(a => (a.meta?.reason === 'kill_switch' || a.meta?.details?.reason === 'kill_switch'))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (since) {
        audits = audits.filter(a => new Date(a.created_at) >= new Date(since));
    }
    
    const cur = cursor ? dec(cursor) : null;
    if (cur?.created_at) {
        audits = audits.filter(a => new Date(a.created_at) < new Date(cur.created_at));
    }

    const pageAudits = audits.slice(0, limit);

    const candidates: any[] = [];
    for (const a of pageAudits) {
        const txId = a.meta?.tx_id || a.meta?.details?.tx_id;
        if (!txId) continue;
        
        const { data: transfer } = await supabase
            .from('incoming_transfers')
            .select('*')
            .eq('paystack_tx_id', txId)
            .single();
            
        if (!transfer) continue;
        const route = await decideRoute(transfer.user_id, transfer.narration || '');
        candidates.push({ 
            tx_id: txId, 
            created_at: a.created_at, 
            user_id: transfer.user_id, 
            amount_kobo: transfer.amount_kobo, 
            narration: transfer.narration, 
            route 
        });
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
        // In a real implementation, this would credit the wallet
        results.push({ tx_id: c.tx_id, status: 'ok' });
        await logAdminAction('mock-admin-id', 'wallet.credit.reapplied', `user:${c.user_id}`, { 
            tx_id: c.tx_id, 
            amount_kobo: c.amount_kobo, 
            route: c.route, 
            bulk: true 
        });
    }

    return { ok: true, dryRun: false, processed: results.length, nextCursor, results };
}
