// FIX: Provide full content for the file to resolve module not found errors.
import type { Incident, UptimeCheck, DlqItem, ArrearsRecord } from '../types';

export const mockIncidents: Incident[] = [
    {
        id: 1,
        title: "Paystack API Latency",
        severity: "minor",
        status: "monitoring",
        updates: [
            { id: 101, body_md: "We are observing increased latency with our payment provider, Paystack. Top-ups may be delayed.", created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: 102, body_md: "Paystack has confirmed the issue and is working on a fix. We are monitoring the situation.", created_at: new Date(Date.now() - 1800000).toISOString() }
        ]
    },
    {
        id: 2,
        title: "DVA Creation Failing for Wema",
        severity: "major",
        status: "investigating",
        updates: [
            { id: 201, body_md: "We are investigating an issue where creating new Dedicated Virtual Accounts with Wema Bank is failing.", created_at: new Date().toISOString() }
        ]
    }
];

export const mockUptimeChecks: UptimeCheck[] = [
    { id: 1, service: 'Supabase Auth', ok: true, latency_ms: 150, checked_at: new Date().toISOString() },
    { id: 2, service: 'Paystack API', ok: true, latency_ms: 450, checked_at: new Date().toISOString() },
    { id: 3, service: 'Gemini API', ok: true, latency_ms: 800, checked_at: new Date().toISOString() },
    { id: 4, service: 'Termii SMS', ok: false, latency_ms: 5000, checked_at: new Date().toISOString() },
    { id: 5, service: 'Core App', ok: true, latency_ms: 50, checked_at: new Date().toISOString() },
];

export const mockDlqItems: DlqItem[] = [
    {
        id: 'dlq-1',
        queue: 'notification-fanout',
        payload: { userId: 'user-007', channel: 'sms', message: 'Your payment is late' },
        error: 'sms_provider_error (attempt 3)',
        attempts: 3,
        last_seen: new Date().toISOString(),
    }
];

export const mockArrearsRecords: ArrearsRecord[] = [
    { org_id: 1, pool_id: '1', user_id: 'user-007', open_cycles: 2, total_owed: 40000 },
    { org_id: 1, pool_id: 'd4e5f6a7-b8c9-0123-4567-890abcdef012', user_id: 'user-003', open_cycles: 1, total_owed: 5000000 },
];