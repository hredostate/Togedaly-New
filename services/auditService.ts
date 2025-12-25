
import type { AuditLog } from '../types';
import { supabase } from '../supabaseClient';

/**
 * Immutably records an admin or system action.
 * @param actor The user ID or system agent performing the action
 * @param action The action code (e.g., 'pool.close', 'payout.approve')
 * @param target The target resource ID (e.g., 'pool:123', 'user:456')
 * @param meta Additional context (reason, previous state, etc.)
 */
export async function logAdminAction(actor: string, action: string, target: string, meta: any = {}): Promise<void> {
    const entry = {
        actor,
        action,
        target,
        meta,
    };
    
    const { error } = await supabase
        .from('audit_logs')
        .insert(entry);
    
    if (error) {
        console.error('[AUDIT ERROR]', error);
        throw error;
    }
    
    console.log(`[AUDIT] ${action} by ${actor}`, entry);
}

/**
 * Fetches the audit trail, optionally filtered.
 */
export async function fetchAuditLogs(filters?: { action?: string, target?: string }): Promise<AuditLog[]> {
    let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (filters?.action) {
        query = query.eq('action', filters.action);
    }
    if (filters?.target) {
        query = query.ilike('target', `%${filters.target}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('[AUDIT FETCH ERROR]', error);
        throw error;
    }
    
    return (data as AuditLog[]) || [];
}
