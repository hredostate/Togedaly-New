
// services/referralService.ts
import { supabase } from '../supabaseClient';
import type { ReferralCode, Referral } from '../types';

// MOCK DATA
let mockReferralCodes: ReferralCode[] = [
    {
        id: 1,
        org_id: 1, // Mock org ID
        code: 'TOGEDA24',
        max_uses: 50,
        used_count: 3,
        reward_type: 'credit',
        reward_value: 5000,
        active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 2,
        org_id: 0, // System code
        code: 'WELCOME2024',
        max_uses: 1000,
        used_count: 150,
        reward_type: 'credit',
        reward_value: 2000,
        active: true,
        created_at: new Date().toISOString(),
    }
];

let mockReferrals: Referral[] = [
    { id: 1, referral_code_id: 1, referrer_org_id: 1, referred_org_id: 101, status: 'rewarded', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), rewarded_at: new Date(Date.now() - 3 * 86400000).toISOString(), meta: {} },
    { id: 2, referral_code_id: 1, referrer_org_id: 1, referred_org_id: 102, status: 'pending', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), meta: {} },
    { id: 3, referral_code_id: 1, referrer_org_id: 1, referred_org_id: 103, status: 'rewarded', created_at: new Date(Date.now() - 1 * 86400000).toISOString(), rewarded_at: new Date().toISOString(), meta: {} },
];

/**
 * Fetches the referral code for an organization.
 */
export async function getReferralCode(orgId: number): Promise<ReferralCode | null> {
    console.log("MOCK: getReferralCode for org:", orgId);
    await new Promise(res => setTimeout(res, 300));
    const code = mockReferralCodes.find(c => c.org_id === orgId);
    return code ? JSON.parse(JSON.stringify(code)) : null;
}

/**
 * Fetches the referral history for an organization.
 */
export async function getReferralHistory(orgId: number): Promise<Referral[]> {
    console.log("MOCK: getReferralHistory for org:", orgId);
    await new Promise(res => setTimeout(res, 400));
    return JSON.parse(JSON.stringify(mockReferrals.filter(r => r.referrer_org_id === orgId)));
}

/**
 * Fetches the referral code for an organization.
 */
export async function getOrgReferralCode(orgId: number): Promise<ReferralCode | null> {
    return getReferralCode(orgId);
}

/**
 * Creates a new referral code for an organization.
 */
export async function createOrgReferralCode(orgId: number, actorId: string): Promise<ReferralCode> {
    console.log("MOCK: createOrgReferralCode for org:", orgId, "by", actorId);
    await new Promise(res => setTimeout(res, 800));
    
    // Check if one already exists
    const existing = mockReferralCodes.find(c => c.org_id === orgId);
    if (existing) return existing;
    
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const code = `ORG${orgId}-${rand}`;

    const newCode: ReferralCode = {
        id: Date.now(),
        org_id: orgId,
        code,
        reward_type: 'credit',
        reward_value: 5000,
        max_uses: 100,
        used_count: 0,
        created_by: actorId,
        active: true,
        created_at: new Date().toISOString(),
    };
    mockReferralCodes.push(newCode);
    
    return newCode;
}

// --- ADMIN ---

export async function getSystemReferralCodes(): Promise<ReferralCode[]> {
    console.log("MOCK: getSystemReferralCodes");
    await new Promise(res => setTimeout(res, 300));
    return JSON.parse(JSON.stringify(mockReferralCodes.filter(c => c.org_id === 0)));
}

export async function upsertReferralCode(data: Partial<ReferralCode>): Promise<ReferralCode> {
    console.log("MOCK: upsertReferralCode", data);
    await new Promise(res => setTimeout(res, 500));
    
    if (data.id) {
        const idx = mockReferralCodes.findIndex(c => c.id === data.id);
        if (idx > -1) {
            mockReferralCodes[idx] = { ...mockReferralCodes[idx], ...data };
            return mockReferralCodes[idx];
        }
    }
    
    const newCode: ReferralCode = {
        id: Date.now(),
        org_id: 0, // system
        code: data.code || `SYS-${Date.now()}`,
        reward_type: 'credit',
        reward_value: data.reward_value || 1000,
        max_uses: data.max_uses || 10000,
        used_count: 0,
        active: true,
        created_at: new Date().toISOString(),
        ...data
    };
    mockReferralCodes.push(newCode);
    return newCode;
}
