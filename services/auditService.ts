
import type { AuditLog } from '../types';

// Centralized immutable log store (Mocking a DB table 'audit_logs')
const auditLogs: AuditLog[] = [
    { 
        id: 'aud-init', 
        actor: 'system', 
        action: 'system.init', 
        target: 'platform', 
        meta: { version: '2.0' }, 
        created_at: new Date().toISOString() 
    }
];

/**
 * Immutably records an admin or system action.
 * @param actor The user ID or system agent performing the action
 * @param action The action code (e.g., 'pool.close', 'payout.approve')
 * @param target The target resource ID (e.g., 'pool:123', 'user:456')
 * @param meta Additional context (reason, previous state, etc.)
 */
export async function logAdminAction(actor: string, action: string, target: string, meta: any = {}): Promise<void> {
    const entry: AuditLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actor,
        action,
        target,
        meta,
        created_at: new Date().toISOString()
    };
    
    // In a real app: await supabase.from('audit_logs').insert(entry);
    console.log(`[AUDIT] ${action} by ${actor}`, entry);
    auditLogs.unshift(entry);
}

/**
 * Fetches the audit trail, optionally filtered.
 */
export async function fetchAuditLogs(filters?: { action?: string, target?: string }): Promise<AuditLog[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let logs = [...auditLogs];
    if (filters?.action) logs = logs.filter(l => l.action === filters.action);
    if (filters?.target) logs = logs.filter(l => l.target.includes(filters.target));
    
    return logs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
