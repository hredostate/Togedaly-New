import { supabase } from '../supabaseClient';

async function fetchOrgKPIs(orgId: number) {
  // Org LTV / revenue
  const { data: ltvRows, error: ltvErr } = await supabase
    .from('v_mart_org_ltv')
    .select('*')
    .eq('org_id', orgId)
    .limit(1);
  if (ltvErr) throw ltvErr;
  const ltv = ltvRows?.[0];

  // Latest cohort health
  const { data: cohortRows, error: chErr } = await supabase
    .from('v_mart_cohort_health')
    .select('*')
    .eq('org_id', orgId)
    .order('cohort_month', { ascending: false })
    .limit(1);
  if (chErr) throw chErr;
  const cohort = cohortRows?.[0];

  // Latest repayment curve for that cohort_month
  let repayment: any[] = [];
  if (cohort?.cohort_month) {
    const { data: repRows, error: repErr } = await supabase
      .from('v_mart_repayment_curves')
      .select('*')
      .eq('org_id', orgId)
      .eq('due_month', cohort.cohort_month)
      .order('day_bucket', { ascending: true });
    if (repErr) throw repErr;
    repayment = repRows ?? [];
  }

  // Nudge ROI – compare nudge vs none for latest month
  const { data: nudgeRows, error: nErr } = await supabase
    .from('v_mart_nudge_outcomes')
    .select('*')
    .eq('org_id', orgId)
    .order('due_month', { ascending: false })
    .limit(20);
  if (nErr) throw nErr;

  return { ltv, cohort, repayment, nudges: nudgeRows };
}

function buildExecHtml(orgName: string, kpis: Awaited<ReturnType<typeof fetchOrgKPIs>>) {
  const { ltv, cohort, repayment, nudges } = kpis;

  const day7 = repayment.find((r) => r.day_bucket === 7);
  const control = nudges?.find((n) => n.nudge_type === 'none');
  const sarcastic = nudges?.find(
    (n) => n.nudge_type !== 'none' && n.variant === 'sarcastic'
  );

  const settleDelta =
    sarcastic && control
      ? (sarcastic.settle_pct - control.settle_pct).toFixed(1)
      : null;

  return `
  <h1>${orgName} – Weekly TrustPool Report</h1>
  <p>This is your snapshot for the last week.</p>

  <h2>Revenue & Credits</h2>
  <ul>
    <li>Fee revenue (lifetime): ₦${(ltv?.fee_revenue ?? 0).toLocaleString()}</li>
    <li>Credits issued (lifetime): ₦${(ltv?.total_credits ?? 0).toLocaleString()}</li>
    <li><strong>Net revenue:</strong> ₦${(ltv?.net_revenue ?? 0).toLocaleString()}</li>
  </ul>

  <h2>Latest Cohort (${new Date(cohort?.cohort_month).toDateString() ?? 'N/A'})</h2>
  <ul>
    <li>Users in cohort: ${cohort?.users_in_cohort ?? 0}</li>
    <li>Settle rate: ${cohort?.settle_pct ?? 0}%</li>
  </ul>

  <h2>Repayment curve (latest cohort)</h2>
  <ul>
    <li>Day 7 cumulative repayment: ${(day7?.cumulative_repayment_ratio * 100 || 0).toFixed(1)}%</li>
  </ul>

  <h2>Nudge ROI (AI coach)</h2>
  ${
    settleDelta !== null
      ? `<p>Sarcastic nudges improved settle rate vs no-nudge by <strong>${settleDelta} pts</strong> on latest cohort.</p>`
      : `<p>Insufficient data yet to compare nudge vs no-nudge.</p>`
  }

  <p style="font-size:12px;color:#888">
    Tip: log in to the admin dashboard to see pool-level breakdowns & member-level arrears.
  </p>
  `;
}

export async function sendWeeklyExecEmailForOrg(orgId: number) {
  // In a real app, you would fetch org details and recipients from the DB.
  // We will mock this for the frontend.
  const orgName = `Org #${orgId}`;
  const recipients: string[] = ['exec1@example.com', 'exec2@example.com'];
  if (!recipients.length) return;

  const kpis = await fetchOrgKPIs(orgId);
  const html = buildExecHtml(orgName, kpis);

  // MOCK: Instead of sending an email, log it to the console.
  console.log('--- MOCK WEEKLY EXEC EMAIL ---');
  console.log(`To: ${recipients.join(', ')}`);
  console.log(`Subject: Weekly TrustPool KPIs – ${orgName}`);
  console.log('--- HTML BODY ---');
  console.log(html);
  console.log('----------------------------');
}