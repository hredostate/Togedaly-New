import { supabase } from '../supabaseClient';
import type { CohortHealth, OrgLTV, RepaymentCurve, NudgeOutcome } from '../types';

export async function getCohortHealth(): Promise<CohortHealth[]> {
    const { data, error } = await supabase.from('v_mart_cohort_health').select('*').order('cohort_month', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getOrgLTV(): Promise<OrgLTV[]> {
    const { data, error } = await supabase.from('v_mart_org_ltv').select('*').order('net_revenue', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getRepaymentCurves(): Promise<RepaymentCurve[]> {
    const { data, error } = await supabase.from('v_mart_repayment_curves').select('*').order('due_month, day_bucket', { ascending: true });
    if (error) throw error;
    return data;
}

export async function getNudgeOutcomes(): Promise<NudgeOutcome[]> {
    const { data, error } = await supabase.from('v_mart_nudge_outcomes').select('*').order('due_month, nudge_type, variant', { ascending: true });
    if (error) throw error;
    return data;
}