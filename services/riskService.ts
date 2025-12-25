
import type { RiskEvent, UserRiskProfile } from '../types';
import { mockUserRiskProfiles, mockKycProfiles } from '../data/riskMockData';
import { logAdminAction } from './auditService';

// Mock in-memory store for risk events
let mockRiskEvents: RiskEvent[] = [];

/**
 * Logs a new risk event for a user. In a real app, this would be called from
 * a secure server-side environment.
 * ---
 * MOCK IMPLEMENTATION: Adds the event to an in-memory array.
 */
export async function logRiskEvent(event: Omit<RiskEvent, 'id' | 'created_at'>): Promise<RiskEvent> {
    console.log("MOCK: logRiskEvent", event);
    await new Promise(resolve => setTimeout(resolve, 200));

    const newEvent: RiskEvent = {
        ...event,
        id: `risk-${Date.now()}`,
        created_at: new Date().toISOString(),
    };
    mockRiskEvents.push(newEvent);

    // In a real app, a database trigger would recompute the user's risk score.
    // We can simulate that here for the mock data.
    const userProfile = mockUserRiskProfiles.find(p => p.user_id === event.user_id);
    if(userProfile) {
        userProfile.risk_30d += event.severity;
        userProfile.risk_all += event.severity;
        userProfile.last_event_at = new Date().toISOString();
    }

    return newEvent;
}

/**
 * Fetches a list of user risk profiles for the admin dashboard.
 * This combines KYC info with aggregated risk scores.
 * ---
 * MOCK IMPLEMENTATION: Returns a static list of mock profiles.
 */
export async function getAdminUserRiskProfiles(): Promise<UserRiskProfile[]> {
    console.log("MOCK: getAdminUserRiskProfiles");
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUserRiskProfiles;
}

/**
 * Triggers a re-validation of a user's KYC details.
 * ---
 * MOCK IMPLEMENTATION: Simulates the re-validation flow by only accepting a user_id
 * and assuming server-side access to PII.
 */
export async function revalidateKyc(userId: string): Promise<{ ok: boolean; queued: boolean }> {
    console.log("MOCK: revalidateKyc (safe) for user", userId);

    const profile = mockKycProfiles.find(p => p.user_id === userId);
    if (!profile) {
        throw new Error('User profile not found');
    }
    
    // In a real app, you'd fetch PII from a secure table. We check our mock data.
    const riskProfile = mockUserRiskProfiles.find(p => p.user_id === userId);
    if (!riskProfile?.data?.nin && !riskProfile?.bvn) {
        throw new Error('no_secure_record');
    }

    profile.status = 'pending';
    profile.updated_at = new Date().toISOString();

    await logAdminAction('mock-admin-id', 'kyc.revalidate', `user:${userId}`, { reason: 'admin_action' });

    // Simulate provider call and webhook response
    setTimeout(() => {
        const profileToUpdate = mockKycProfiles.find(p => p.user_id === userId);
        if (profileToUpdate) {
            profileToUpdate.status = 'verified';
            profileToUpdate.data.reason = 'Re-validated by admin';
            profileToUpdate.updated_at = new Date().toISOString();
        }
    }, 5000); // 5 sec delay

    await new Promise(res => setTimeout(res, 500));
    return { ok: true, queued: true };
}
