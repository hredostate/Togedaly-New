// FIX: Provide full content for the file to resolve module not found errors.
import type { Incident, UptimeCheck, DlqItem, IncidentSeverity, IncidentStatus, ArrearsRecord } from '../types';
import { mockIncidents, mockUptimeChecks, mockDlqItems, mockArrearsRecords } from '../data/opsMockData';

let incidentsDb = [...mockIncidents];
let dlqDb = [...mockDlqItems];

export async function getPublicIncidents(): Promise<Incident[]> {
    await new Promise(res => setTimeout(res, 300));
    return incidentsDb.filter(i => i.status !== 'resolved');
}

export async function getUptimeChecks(): Promise<UptimeCheck[]> {
    await new Promise(res => setTimeout(res, 200));
    return mockUptimeChecks;
}

export async function openIncident(title: string, body: string, severity: IncidentSeverity): Promise<Incident> {
    await new Promise(res => setTimeout(res, 500));
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
    return dlqDb;
}

export async function retryDlqItem(id: string): Promise<void> {
    await new Promise(res => setTimeout(res, 600));
    dlqDb = dlqDb.filter(i => i.id !== id);
}

export async function getArrearsRecords(): Promise<ArrearsRecord[]> {
    await new Promise(res => setTimeout(res, 300));
    return mockArrearsRecords;
}