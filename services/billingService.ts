
// services/billingService.ts
import { supabase } from '../supabaseClient';
import type { BillingPlan, OrgSubscription, PlanTier, SubscriptionStatus, PromoCode, OrgCredit } from '../types';

/**
 * Fetches all available membership tiers.
 */
export async function getAvailablePlans(): Promise<BillingPlan[]> {
    const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_fee', { ascending: true });
    
    if (error) throw error;
    return data as BillingPlan[];
}

/**
 * Fetches the current subscription/membership for a user (mapped to orgId for now).
 */
export async function getOrgSubscription(orgId: number): Promise<{ subscription: OrgSubscription | null; plan: BillingPlan | null }> {
    const { data: subscription, error: subError } = await supabase
        .from('org_subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .single();
    
    if (subError && subError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw subError;
    }

    if (!subscription) {
        // Return free plan if no subscription exists
        const { data: freePlan } = await supabase
            .from('billing_plans')
            .select('*')
            .eq('tier', 'free')
            .single();
        
        return { 
            subscription: null, 
            plan: freePlan as BillingPlan || null 
        };
    }

    // Fetch the plan details
    const { data: plan, error: planError } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single();
    
    if (planError) throw planError;
    
    return { 
        subscription: subscription as OrgSubscription, 
        plan: plan as BillingPlan 
    };
}

/**
 * Updates a user's membership tier.
 */
export async function updateOrgSubscription(orgId: number, newPlanId: number, actorId: string): Promise<void> {
    // Verify plan exists
    const { data: plan, error: planError } = await supabase
        .from('billing_plans')
        .select('id')
        .eq('id', newPlanId)
        .single();
    
    if (planError || !plan) throw new Error("The selected tier does not exist.");
    
    // Check if subscription exists
    const { data: existing } = await supabase
        .from('org_subscriptions')
        .select('org_id')
        .eq('org_id', orgId)
        .single();
    
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    if (existing) {
        // Update existing subscription
        const { error } = await supabase
            .from('org_subscriptions')
            .update({
                plan_id: newPlanId,
                updated_at: now
            })
            .eq('org_id', orgId);
        
        if (error) throw error;
    } else {
        // Create new subscription
        const { error } = await supabase
            .from('org_subscriptions')
            .insert({
                org_id: orgId,
                plan_id: newPlanId,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                meta: {}
            });
        
        if (error) throw error;
    }
}

/**
 * Applies a promo code to a subscription.
 */
export async function applyPromoCode(orgId: number, code: string): Promise<boolean> {
    // Find the promo code
    const { data: promo, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .single();
    
    if (promoError || !promo) throw new Error("Promo code not found or inactive.");
    
    // Check usage limits
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
        throw new Error("Promo code has reached maximum usage.");
    }

    // Update subscription with promo code
    const { error } = await supabase
        .from('org_subscriptions')
        .update({
            promo_code_id: promo.id,
            updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId);
    
    if (error) throw error;
    
    // Increment usage count
    await supabase
        .from('promo_codes')
        .update({
            used_count: promo.used_count + 1,
            updated_at: new Date().toISOString()
        })
        .eq('id', promo.id);
    
    return true;
}

/**
 * Claims a referral code.
 */
export async function claimReferralCode(orgId: number, code: string, actorId: string): Promise<boolean> {
    // In a real implementation, this would validate and apply the referral code
    const { error } = await supabase
        .from('org_subscriptions')
        .update({
            referral_code_id: 999, // Placeholder
            updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId);
    
    if (error) throw error;
    return true;
}

/**
 * Fetches credit history.
 */
export async function getOrgCredits(orgId: number): Promise<OrgCredit[]> {
    const { data, error } = await supabase
        .from('org_credits')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as OrgCredit[];
}

// --- ADMIN FUNCTIONS ---

export async function upsertBillingPlan(plan: Partial<BillingPlan>): Promise<BillingPlan> {
    // Enforce AI Nudges for all plans
    const features = { ...plan.features, ai_nudges: true };

    if (plan.id) {
        // Update existing plan
        const { data, error } = await supabase
            .from('billing_plans')
            .update({
                ...plan,
                features,
                updated_at: new Date().toISOString()
            })
            .eq('id', plan.id)
            .select()
            .single();
        
        if (error) throw error;
        return data as BillingPlan;
    }
    
    // Create new plan
    const { data, error } = await supabase
        .from('billing_plans')
        .insert({
            tier: plan.tier || 'pro',
            name: plan.name || 'New Tier',
            currency: 'NGN',
            monthly_fee: plan.monthly_fee || 0,
            max_pools: plan.max_pools || 5,
            max_members: 0,
            max_org_admins: 0,
            features,
            is_active: true,
            ...plan
        })
        .select()
        .single();
    
    if (error) throw error;
    return data as BillingPlan;
}

export async function deleteBillingPlan(planId: number): Promise<void> {
    const { error } = await supabase
        .from('billing_plans')
        .update({ is_active: false })
        .eq('id', planId);
    
    if (error) throw error;
}

export async function getGlobalPromos(): Promise<PromoCode[]> {
    const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as PromoCode[];
}

export async function upsertGlobalPromo(promo: Partial<PromoCode>): Promise<PromoCode> {
    if (promo.id) {
        // Update existing promo
        const { data, error } = await supabase
            .from('promo_codes')
            .update({
                ...promo,
                updated_at: new Date().toISOString()
            })
            .eq('id', promo.id)
            .select()
            .single();
        
        if (error) throw error;
        return data as PromoCode;
    }
    
    // Create new promo
    const { data, error } = await supabase
        .from('promo_codes')
        .insert({
            code: promo.code?.toUpperCase() || 'CODE',
            description: promo.description || '',
            promo_type: promo.promo_type || 'percent_off',
            value: promo.value || 0,
            used_count: 0,
            per_org_limit: promo.per_org_limit || 1,
            active: true,
            meta: {},
            ...promo
        })
        .select()
        .single();
    
    if (error) throw error;
    return data as PromoCode;
}
