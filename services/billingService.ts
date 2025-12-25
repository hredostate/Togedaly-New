
// services/billingService.ts
import { supabase } from '../supabaseClient';
import type { BillingPlan, OrgSubscription, PlanTier, SubscriptionStatus, PromoCode, OrgCredit } from '../types';

// MOCK DATA: B2C Membership Tiers
let mockPlans: BillingPlan[] = [
    {
        id: 1,
        tier: 'free',
        name: 'Starter',
        currency: 'NGN',
        monthly_fee: 0,
        max_pools: 1, // Limit active pools
        max_members: 0, // N/A for B2C
        max_org_admins: 0, // N/A for B2C
        features: { ai_nudges: true, priority_support: false }, // AI Nudge enabled for ALL
        is_active: true,
    },
    {
        id: 2,
        tier: 'pro',
        name: 'Verified Saver',
        currency: 'NGN',
        monthly_fee: 1000,
        annual_fee: 10000,
        max_pools: 5,
        max_members: 0,
        max_org_admins: 0,
        features: { ai_nudges: true, priority_support: true },
        is_active: true,
    },
    {
        id: 3,
        tier: 'enterprise',
        name: 'Odogwu VIP',
        currency: 'NGN',
        monthly_fee: 5000,
        max_pools: 999, // Unlimited
        max_members: 0,
        max_org_admins: 0,
        features: { ai_nudges: true, priority_support: true, custom_branding: true }, // custom_branding = VIP Badge/Theme
        is_active: true,
    },
];

let mockSubscription: OrgSubscription = {
    org_id: 1, // Represents the user's ID in this B2C context
    plan_id: 2, // Currently on Verified Saver
    status: 'active',
    current_period_start: new Date(Date.now() - 15 * 86400000).toISOString(),
    current_period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
    meta: {},
    updated_at: new Date().toISOString(),
};

let mockPromos: PromoCode[] = [
    { id: 1, code: 'LAUNCH50', description: '50% off for 3 months', promo_type: 'percent_off', value: 50, used_count: 5, per_org_limit: 1, created_at: new Date().toISOString(), active: true, meta: {} } as PromoCode
];

let mockOrgCredits: OrgCredit[] = [
    {
        id: 1,
        org_id: 1,
        amount: 500,
        description: 'Referral reward: Invited Friend',
        source: 'referral',
        created_at: new Date().toISOString(),
        created_by: 'system',
    },
    {
        id: 2,
        org_id: 1,
        amount: -1000,
        description: 'Monthly Membership Fee - Verified Saver',
        source: 'manual',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        created_by: 'system',
        consumed_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    }
];

/**
 * Fetches all available membership tiers.
 */
export async function getAvailablePlans(): Promise<BillingPlan[]> {
    console.log("MOCK: getAvailablePlans");
    await new Promise(res => setTimeout(res, 300));
    return JSON.parse(JSON.stringify(mockPlans));
}

/**
 * Fetches the current subscription/membership for a user (mapped to orgId for now).
 */
export async function getOrgSubscription(orgId: number): Promise<{ subscription: OrgSubscription | null; plan: BillingPlan | null }> {
    console.log("MOCK: getSubscription for user/org:", orgId);
    await new Promise(res => setTimeout(res, 400));

    if (mockSubscription.org_id !== orgId) {
        // Fallback to free plan if no sub
        const freePlan = mockPlans.find(p => p.tier === 'free') || null;
        return { 
            subscription: { 
                org_id: orgId, plan_id: freePlan?.id || 1, status: 'active', 
                current_period_start: new Date().toISOString(), current_period_end: new Date().toISOString(), 
                meta: {}, updated_at: new Date().toISOString() 
            }, 
            plan: freePlan 
        };
    }

    const plan = mockPlans.find(p => p.id === mockSubscription.plan_id) || null;
    return { subscription: JSON.parse(JSON.stringify(mockSubscription)), plan };
}

/**
 * Updates a user's membership tier.
 */
export async function updateOrgSubscription(orgId: number, newPlanId: number, actorId: string): Promise<void> {
    console.log("MOCK: updateSubscription", { orgId, newPlanId });
    await new Promise(res => setTimeout(res, 800));
    
    const planExists = mockPlans.some(p => p.id === newPlanId);
    if (!planExists) throw new Error("The selected tier does not exist.");
    
    mockSubscription.org_id = orgId; // Ensure ownership
    mockSubscription.plan_id = newPlanId;
    mockSubscription.updated_at = new Date().toISOString();
}

/**
 * Applies a promo code to a subscription.
 */
export async function applyPromoCode(orgId: number, code: string): Promise<boolean> {
    console.log("MOCK: applyPromoCode", { orgId, code });
    await new Promise(res => setTimeout(res, 600));
    
    const promo = mockPromos.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active);
    if (!promo) throw new Error("Promo code not found or inactive.");

    mockSubscription.promo_code_id = promo.id;
    mockSubscription.updated_at = new Date().toISOString();
    
    return true;
}

/**
 * Claims a referral code.
 */
export async function claimReferralCode(orgId: number, code: string, actorId: string): Promise<boolean> {
    console.log("MOCK: claimReferralCode", { orgId, code });
    await new Promise(res => setTimeout(res, 600));
    mockSubscription.referral_code_id = 999;
    return true;
}

/**
 * Fetches credit history.
 */
export async function getOrgCredits(orgId: number): Promise<OrgCredit[]> {
    await new Promise(res => setTimeout(res, 350));
    return JSON.parse(JSON.stringify(mockOrgCredits.filter(c => c.org_id === orgId)));
}

// --- ADMIN FUNCTIONS ---

export async function upsertBillingPlan(plan: Partial<BillingPlan>): Promise<BillingPlan> {
    console.log("MOCK: upsertBillingPlan", plan);
    await new Promise(res => setTimeout(res, 500));
    
    // Enforce AI Nudges for all plans
    const features = { ...plan.features, ai_nudges: true, priority_support: plan.features?.priority_support ?? false };

    if (plan.id) {
        const idx = mockPlans.findIndex(p => p.id === plan.id);
        if (idx > -1) {
            mockPlans[idx] = { ...mockPlans[idx], ...plan, features };
            return mockPlans[idx];
        }
    }
    
    const newPlan: BillingPlan = {
        id: Date.now(),
        tier: plan.tier || 'pro',
        name: plan.name || 'New Tier',
        currency: 'NGN',
        monthly_fee: plan.monthly_fee || 0,
        max_pools: plan.max_pools || 5,
        max_members: 0,
        max_org_admins: 0,
        features: features as any,
        is_active: true,
        ...plan
    };
    mockPlans.push(newPlan);
    return newPlan;
}

export async function deleteBillingPlan(planId: number): Promise<void> {
    console.log("MOCK: deleteBillingPlan", planId);
    await new Promise(res => setTimeout(res, 400));
    mockPlans = mockPlans.filter(p => p.id !== planId);
}

export async function getGlobalPromos(): Promise<PromoCode[]> {
    await new Promise(res => setTimeout(res, 300));
    return JSON.parse(JSON.stringify(mockPromos));
}

export async function upsertGlobalPromo(promo: Partial<PromoCode>): Promise<PromoCode> {
    console.log("MOCK: upsertGlobalPromo", promo);
    await new Promise(res => setTimeout(res, 500));
    
    const newPromo: PromoCode = {
        id: Date.now(),
        code: promo.code || 'CODE',
        description: promo.description || '',
        promo_type: promo.promo_type || 'percent_off',
        value: promo.value || 0,
        used_count: 0,
        per_org_limit: 1,
        created_at: new Date().toISOString(),
        active: true,
        meta: {},
        ...promo
    };
    mockPromos.push(newPromo);
    return newPromo;
}
