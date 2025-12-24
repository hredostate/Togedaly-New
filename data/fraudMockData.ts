import type { VelocityAlert, DeviceMatrix } from '../types';

export const mockVelocityAlerts: VelocityAlert[] = [
    { id: 'vel-1', user_id: 'user-007', rule: 'failed_payments_1h', value: 5, triggered_at: new Date().toISOString() },
    { id: 'vel-2', user_id: 'user-003', rule: 'distinct_cards_24h', value: 4, triggered_at: new Date(Date.now() - 3600000).toISOString() },
];

export const mockDeviceMatrix: DeviceMatrix[] = [
    { fingerprint: 'fp_abc123', first_seen: new Date(Date.now() - 10 * 86400000).toISOString(), last_seen: new Date().toISOString(), user_ids: ['user-001', 'user-002'] },
    { fingerprint: 'fp_def456', first_seen: new Date(Date.now() - 5 * 86400000).toISOString(), last_seen: new Date(Date.now() - 86400000).toISOString(), user_ids: ['user-007'] },
];
