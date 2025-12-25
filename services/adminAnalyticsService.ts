
// TODO: Connect to real Supabase data
// This service should query real analytics data from the database.
// Required tables/views:
// - org_health_metrics: Organization health summary (org_id, total_members, active_pools, total_volume, health_score)
// - org_arrears: Arrears tracking (org_id, member_id, amount_overdue, days_overdue, pool_id)
// - unlock_eligibility: Member eligibility for pool unlocks (org_id, member_id, eligible, reasons)
//
// Example queries needed:
// - SELECT * FROM org_health_metrics WHERE org_id = $1
// - SELECT * FROM org_arrears WHERE org_id = $1 AND amount_overdue > 0
// - SELECT * FROM unlock_eligibility WHERE org_id = $1

export async function getOrgHealth(orgId: string) {
    await new Promise(res => setTimeout(res, 300));
    // TODO: Replace with: return supabase.from('org_health_metrics').select('*').eq('org_id', orgId).single()
    return null;
}

export async function getOrgArrears(orgId: string) {
    await new Promise(res => setTimeout(res, 400));
    // TODO: Replace with: return supabase.from('org_arrears').select('*').eq('org_id', orgId).gt('amount_overdue', 0)
    return [];
}

export async function getUnlockEligibility(orgId: string) {
    await new Promise(res => setTimeout(res, 300));
    // TODO: Replace with: return supabase.from('unlock_eligibility').select('*').eq('org_id', orgId)
    return [];
}
