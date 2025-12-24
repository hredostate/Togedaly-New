
import { db } from '../lib/db';
import type { KycProfile, DeviceEvent } from '../types';

export async function getKycProfile(userId: string): Promise<KycProfile | null> {
    const local = db.getKycStatus(userId);
    return {
        user_id: userId,
        status: local.status as any,
        data: local,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

export async function canTopup(amountNaira: number): Promise<{ allowed: boolean; reason: string }> {
    // Simplified logic, allowing topup for demo
    return { allowed: true, reason: 'ok' };
}

export async function getDeviceHistory(): Promise<DeviceEvent[]> {
    return [
        { id: 1, device_hash: 'current-device', ip: '127.0.0.1', city: 'Lagos', country: 'NG', created_at: new Date().toISOString() }
    ];
}

// Helper to update status (used by Kyc page)
export async function submitKyc(userId: string, data: any) {
    await new Promise(r => setTimeout(r, 1500));
    db.setKycStatus(userId, 'verified', data);
    return true;
}
