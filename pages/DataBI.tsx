
import React, { useState, useEffect } from 'react';
import type { Page } from '../App';
import { useToasts } from '../components/ToastHost';
import { getCohortHealth, getOrgLTV, getRepaymentCurves, getNudgeOutcomes } from '../services/biService';
import { sendWeeklyExecEmailForOrg } from '../services/execReportService';
import { DataTable } from '../components/admin/ops/DataTable';
import { TrendChart } from '../components/ui/TrendChart';

type BITab = 'cohorts' | 'ltv' | 'curves' | 'nudges' | 'report';

const CohortsTab: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getCohortHealth().then(data => {
            // Transform data for chart: map cohort_month to readable date
            const chartData = data.map(d => ({
                ...d,
                month: new Date(d.cohort_month).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
            }));
            setData(chartData);
        }).finally(() => setLoading(false));
    }, []);
    if (loading) return <div>Loading cohort data...</div>;
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cohort Health</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-2xl p-4 bg-white">
                    <div className="text-sm font-medium text-gray-500 mb-2">Total Due (₦) by Cohort</div>
                    <TrendChart data={data} dataKey="total_due" categoryKey="month" type="bar" color="#4F46E5" />
                </div>
                <div className="border rounded-2xl p-4 bg-white">
                    <div className="text-sm font-medium text-gray-500 mb-2">Settlement Rate (%)</div>
                    <TrendChart data={data} dataKey="settle_pct" categoryKey="month" type="line" color="#10B981" formatter={(v) => `${v}%`} />
                </div>
            </div>
            <DataTable rows={data} cols={['month', 'users_in_cohort', 'total_due', 'total_settled', 'settle_pct']} />
        </div>
    );
};

const LTVTab: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getOrgLTV().then(setData).finally(() => setLoading(false));
    }, []);
    if (loading) return <div>Loading LTV data...</div>;
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Org LTV (Lifetime Value)</h3>
            <div className="border rounded-2xl p-4 bg-white">
                <div className="text-sm font-medium text-gray-500 mb-2">Net Revenue by Org</div>
                <TrendChart data={data} dataKey="net_revenue" categoryKey="org_name" type="bar" color="#F59E0B" />
            </div>
            <DataTable rows={data} cols={['org_id', 'org_name', 'fee_revenue', 'total_credits', 'net_revenue']} />
        </div>
    );
};

const CurvesTab: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getRepaymentCurves().then(items => {
            // For charts, we might want to group by bucket. 
            // For simplicity, just listing them.
            setData(items);
        }).finally(() => setLoading(false));
    }, []);
    if (loading) return <div>Loading repayment curves...</div>;
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Repayment Curves</h3>
            <div className="border rounded-2xl p-4 bg-white">
                <div className="text-sm font-medium text-gray-500 mb-2">Repayment Ratio by Day Bucket</div>
                <TrendChart data={data} dataKey="cumulative_repayment_ratio" categoryKey="day_bucket" type="line" color="#8B5CF6" formatter={(v) => v.toFixed(2)} />
            </div>
            <DataTable rows={data} cols={['due_month', 'day_bucket', 'cumulative_repayment_ratio']} />
        </div>
    );
};

const NudgesTab: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getNudgeOutcomes().then(setData).finally(() => setLoading(false));
    }, []);
    if (loading) return <div>Loading nudge ROI data...</div>;
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nudge ROI</h3>
            <div className="border rounded-2xl p-4 bg-white">
                <div className="text-sm font-medium text-gray-500 mb-2">Settlement % by Variant</div>
                <TrendChart data={data} dataKey="settle_pct" categoryKey="variant" type="bar" color="#EC4899" formatter={(v) => `${v}%`} />
            </div>
            <DataTable rows={data} cols={['due_month', 'nudge_type', 'variant', 'obligations', 'settle_pct', 'avg_days_to_settle']} />
        </div>
    );
};

const ReportTab: React.FC = () => {
    const { add: addToast } = useToasts();
    const [sending, setSending] = useState(false);
    const MOCK_ORG_ID = 1;

    const handleSend = async () => {
        setSending(true);
        try {
            await sendWeeklyExecEmailForOrg(MOCK_ORG_ID);
            addToast({
                title: 'Email Sent (Mock)',
                desc: 'The weekly executive report has been generated and sent. Check the console to see the HTML output.',
                emoji: '📧',
                timeout: 8000
            });
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setSending(false);
        }
    };
    
    return (
        <div className="space-y-4 rounded-2xl border bg-white p-4">
            <h3 className="text-lg font-semibold">Executive Reporting</h3>
            <p className="text-sm text-gray-600">Trigger the weekly executive KPI summary email. This is a mock action that will log the generated HTML to the console.</p>
            <button onClick={handleSend} disabled={sending} className="px-4 py-2 rounded-xl bg-brand text-white font-semibold disabled:opacity-50">
                {sending ? 'Generating...' : 'Send Weekly Report Now'}
            </button>
        </div>
    );
};


const DataBI: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const [tab, setTab] = useState<BITab>('cohorts');
  
  const NavLink: React.FC<{ id: BITab, children: React.ReactNode }> = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );

  const renderContent = () => {
    switch(tab) {
        case 'cohorts': return <CohortsTab />;
        case 'ltv': return <LTVTab />;
        case 'curves': return <CurvesTab />;
        case 'nudges': return <NudgesTab />;
        case 'report': return <ReportTab />;
        default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Data &amp; BI</h2>
      <div className="rounded-2xl border bg-white p-2 flex flex-wrap gap-2">
        <NavLink id="cohorts">Cohorts</NavLink>
        <NavLink id="ltv">Org LTV</NavLink>
        <NavLink id="curves">Repayment Curves</NavLink>
        <NavLink id="nudges">Nudge ROI</NavLink>
        <NavLink id="report">Exec Report</NavLink>
      </div>
      <div className="rounded-2xl border bg-white p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default DataBI;
