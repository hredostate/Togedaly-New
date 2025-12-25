// services/opsService.ts
import type { Incident, UptimeCheck, DlqItem, IncidentSeverity, IncidentStatus, ArrearsRecord } from '../types';

// TODO: Connect to real Supabase data
// This service uses in-memory arrays that reset on refresh. Should use Supabase tables instead:
// 
// Required tables:
// - incidents: Store incident reports (id, title, severity, status, created_at, resolved_at)
// - incident_updates: Store incident updates (id, incident_id, body_md, created_at)
// - uptime_checks: Store uptime monitoring results (id, service_name, status, last_check, response_time)
// - dlq_items: Dead-letter queue items (id, queue_name, payload, error, retry_count, created_at)
// - arrears_records: Track member arrears (id, member_id, pool_id, amount_overdue, days_overdue, status)
//
// Example queries needed:
// - SELECT * FROM incidents WHERE status != 'resolved' ORDER BY created_at DESC
// - INSERT INTO incidents (title, severity, status) VALUES ($1, $2, $3) RETURNING *
// - UPDATE incidents SET status = $1 WHERE id = $2
// - SELECT * FROM dlq_items ORDER BY created_at DESC
// - DELETE FROM dlq_items WHERE id = $1

let incidentsDb: Incident[] = [];
let dlqDb: DlqItem[] = [];
let uptimeChecks: UptimeCheck[] = [];

export async function getPublicIncidents(): Promise<Incident[]> {
    await new Promise(res => setTimeout(res, 300));
    // TODO: Replace with: return supabase.from('incidents').select('*, incident_updates(*)').neq('status', 'resolved')
    return incidentsDb.filter(i => i.status !== 'resolved');
}

export async function getUptimeChecks(): Promise<UptimeCheck[]> {
    await new Promise(res => setTimeout(res, 200));
    // TODO: Replace with: return supabase.from('uptime_checks').select('*').order('last_check', { ascending: false })
    return uptimeChecks;
}

export async function openIncident(title: string, body: string, severity: IncidentSeverity): Promise<Incident> {
    await new Promise(res => setTimeout(res, 500));
    // TODO: Replace with transaction that inserts into both incidents and incident_updates tables
    const newIncident: Incident = {
        id: Date.now(),
        title,
        severity,
        status: 'investigating',
        updates: [{ id: Date.now() + 1, body_md: body, created_at: new Date().toISOString() }]
    };
    incidentsDb.unshift(newIncident);
    return newIncident;
}

export async function updateIncident(id: number, body: string, status: IncidentStatus | null, resolve: boolean): Promise<Incident> {
    await new Promise(res => setTimeout(res, 400));
    // TODO: Replace with Supabase transaction that updates incident and adds update
    const incident = incidentsDb.find(i => i.id === id);
    if (!incident) throw new Error("Incident not found");

    if (body) {
        incident.updates.unshift({ id: Date.now(), body_md: body, created_at: new Date().toISOString() });
    }
    if (status) {
        incident.status = status;
    }
    if (resolve) {
        incident.status = 'resolved';
    }
    return incident;
}

export async function getDlqItems(): Promise<DlqItem[]> {
    await new Promise(res => setTimeout(res, 400));
    // TODO: Replace with: return supabase.from('dlq_items').select('*').order('created_at', { ascending: false })
    return dlqDb;
}

export async function retryDlqItem(id: string): Promise<void> {
    await new Promise(res => setTimeout(res, 600));
    // TODO: Replace with: await supabase.from('dlq_items').delete().eq('id', id)
    dlqDb = dlqDb.filter(i => i.id !== id);
}

export async function getArrearsRecords(): Promise<ArrearsRecord[]> {
    await new Promise(res => setTimeout(res, 300));
    // TODO: Replace with: return supabase.from('arrears_records').select('*').order('days_overdue', { ascending: false })
    return mockArrearsRecords;
}