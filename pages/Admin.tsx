
import React, { useState, useEffect, useMemo } from 'react';
import type { Page } from '../App';
import KycQueue from '../components/admin/KycQueue';
import VentureModeration from '../components/admin/VentureModeration';
import RiskDashboard from '../components/admin/RiskDashboard';
import AuditTrail from '../components/admin/AuditTrail';
import EnvCheck from '../components/admin/EnvCheck';
import Routing from '../components/admin/Routing';
import ReapplyCredits from '../components/admin/ReapplyCredits';
import AdminDisputes from '../components/admin/Disputes';
import NudgeAdmin from '../components/admin/NudgeAdmin';
import FraudDashboard from '../components/admin/FraudDashboard';
import NotificationsConsole from '../components/admin/NotificationsConsole';
import Backups from '../components/admin/Backups';
import Checklists from '../components/admin/Checklists';
import AdminSupport from '../components/admin/Support';
import Billing from '../components/admin/Billing';
import Referrals from '../components/admin/Referrals';
import Approvals from '../components/admin/Approvals';
import UserManagement from '../components/admin/UserManagement';
import DataBI from './DataBI';
import Logistics from './Logistics';
import AdminSmsConfig from './AdminSmsConfig';
import { getUsers, getKycQueue, getAdminActionRequests, getRiskEvents } from '../services/adminService';

type AdminTab = 'overview' | 'users' | 'kyc' | 'ventures' | 'risk' | 'audit' | 'env' | 'routing' | 'credits' | 'disputes' | 'nudges' | 'fraud' | 'notifications' | 'backups' | 'checklists' | 'support' | 'billing' | 'referrals' | 'approvals' | 'dataBI' | 'logistics' | 'smsConfig';

// --- Configuration ---

const MENU_GROUPS = [
  {
    title: 'Command Center',
    items: [
      { id: 'overview', label: 'Overview', icon: '⚡' },
      { id: 'users', label: 'User Directory', icon: '👥' },
      { id: 'approvals', label: 'Approvals Queue', icon: '✅' },
    ]
  },
  {
    title: 'Trust & Safety',
    items: [
      { id: 'kyc', label: 'KYC Verification', icon: '🆔' },
      { id: 'risk', label: 'Risk Scoring', icon: '🛡️' },
      { id: 'fraud', label: 'Fraud Monitor', icon: '🚨' },
      { id: 'disputes', label: 'Disputes', icon: '⚖️' },
    ]
  },
  {
    title: 'Finance & Treasury',
    items: [
      { id: 'credits', label: 'Credit Recon', icon: '💳' },
      { id: 'routing', label: 'Routing Rules', icon: '🔀' },
      { id: 'billing', label: 'Plans & Billing', icon: '💰' },
      { id: 'logistics', label: 'Logistics', icon: '🚚' },
    ]
  },
  {
    title: 'Platform Ops',
    items: [
      { id: 'ventures', label: 'Pool Manager', icon: '🎱' },
      { id: 'support', label: 'Support Tickets', icon: '🎫' },
      { id: 'referrals', label: 'Referrals', icon: '🤝' },
      { id: 'notifications', label: 'Notification Log', icon: '🔔' },
      { id: 'nudges', label: 'Nudge Experiments', icon: '🧪' },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'dataBI', label: 'Analytics & BI', icon: '📊' },
    ]
  },
  {
    title: 'System Internals',
    items: [
      { id: 'audit', label: 'Audit Trail', icon: '👣' },
      { id: 'backups', label: 'Backups', icon: '💾' },
      { id: 'checklists', label: 'Ops Checklists', icon: '📋' },
      { id: 'env', label: 'Environment', icon: '🔧' },
      { id: 'smsConfig', label: 'SMS Config', icon: '📱' },
    ]
  }
];

// --- Internal Components ---

const AdminOverview: React.FC<{ setPage: (page: Page, context?: any) => void, setTab: (tab: AdminTab) => void }> = ({ setPage, setTab }) => {
    const [stats, setStats] = useState({
        users: 0,
        kycPending: 0,
        approvals: 0,
        riskHigh: 0,
        tvl: '₦125M' // Mock
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getUsers().then(u => u.length),
            getKycQueue().then(q => q.length),
            getAdminActionRequests(1).then(r => r.length),
            getRiskEvents().then(e => e.filter(ev => ev.severity === 'high' || ev.severity === 'critical').length)
        ]).then(([users, kycPending, approvals, riskHigh]) => {
            setStats(prev => ({ ...prev, users, kycPending, approvals, riskHigh }));
            setLoading(false);
        });
    }, []);

    const MetricCard = ({ title, value, icon, color, onClick }: any) => (
        <div onClick={onClick} className={`p-5 bg-white rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md group`}>
            <div>
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
                <div className="text-3xl font-extrabold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {loading ? '...' : value}
                </div>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${color}`}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-500 text-sm">System status and pending items requiring attention.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Users" value={stats.users} icon="👥" color="bg-blue-50 text-blue-600" onClick={() => setTab('users')} />
                <MetricCard title="Pending Approvals" value={stats.approvals} icon="✍️" color={stats.approvals > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"} onClick={() => setTab('approvals')} />
                <MetricCard title="KYC Queue" value={stats.kycPending} icon="🆔" color={stats.kycPending > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"} onClick={() => setTab('kyc')} />
                <MetricCard title="High Risk Events" value={stats.riskHigh} icon="🚨" color={stats.riskHigh > 0 ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-600"} onClick={() => setTab('risk')} />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">⚡</div>
                    <h3 className="text-xl font-bold mb-2">System Operations</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-md">
                        Monitor payment gateways, message queues, and infrastructure health in real-time.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={() => setPage('ops')} className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition shadow-lg shadow-brand/20">
                            Open Ops Dashboard
                        </button>
                        <button onClick={() => setPage('status')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition backdrop-blur-md">
                            Public Status Page
                        </button>
                        <button onClick={() => setPage('orgDashboard', { orgId: '1' })} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-900/30">
                            Main Org Overview
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border p-6 flex flex-col justify-center gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">💸</div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Total Value Locked</div>
                            <div className="text-xs text-gray-500">Across all active pools</div>
                        </div>
                    </div>
                    <div className="text-3xl font-mono font-bold text-gray-900">{stats.tvl}</div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-3/4"></div>
                    </div>
                    <button onClick={() => setTab('dataBI')} className="text-xs text-indigo-600 font-medium hover:underline mt-1">View Financial Reports →</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Layout ---

const Admin: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Close sidebar on mobile when tab changes
  useEffect(() => {
      setSidebarOpen(false);
  }, [tab]);

  const renderContent = () => {
    switch (tab) {
        case 'overview': return <AdminOverview setPage={setPage} setTab={setTab} />;
        case 'users': return <UserManagement />;
        case 'approvals': return <Approvals />;
        case 'kyc': return <KycQueue />;
        case 'ventures': return <VentureModeration />;
        case 'risk': return <RiskDashboard />;
        case 'audit': return <AuditTrail />;
        case 'env': return <EnvCheck />;
        case 'routing': return <Routing />;
        case 'credits': return <ReapplyCredits />;
        case 'disputes': return <AdminDisputes />;
        case 'support': return <AdminSupport />;
        case 'billing': return <Billing />;
        case 'referrals': return <Referrals />;
        case 'nudges': return <NudgeAdmin />;
        case 'fraud': return <FraudDashboard />;
        case 'notifications': return <NotificationsConsole />;
        case 'backups': return <Backups />;
        case 'checklists': return <Checklists />;
        case 'dataBI': return <DataBI setPage={setPage} />;
        case 'logistics': return <Logistics setPage={setPage} />;
        case 'smsConfig': return <AdminSmsConfig />;
        default: return <div className="p-8 text-center text-gray-500">Select an item from the menu</div>;
    }
  };

  const activeGroup = useMemo(() => {
      for (const group of MENU_GROUPS) {
          if (group.items.find(i => i.id === tab)) return group.title;
      }
      return 'Overview';
  }, [tab]);

  return (
    <div className="flex h-[calc(100vh-80px)] -mt-6 -mx-4 md:-mx-0 md:mt-0 rounded-tl-3xl overflow-hidden bg-slate-50 border-t border-l border-slate-200 shadow-2xl relative">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
            className="absolute inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute md:relative z-30 h-full w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg shadow-brand-500/30">
                ⚡
            </div>
            <div>
                <div className="font-bold text-white leading-none">GOD MODE</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">v2.4.0-stable</div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
            {MENU_GROUPS.map((group, idx) => (
                <div key={idx}>
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        {group.title}
                    </div>
                    <div className="space-y-0.5">
                        {group.items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setTab(item.id as AdminTab)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    tab === item.id 
                                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20' 
                                    : 'hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                                {tab === item.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
            <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Exit God Mode
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <h2 className="text-lg font-semibold text-slate-800 hidden md:block">{activeGroup}</h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                        type="text" 
                        placeholder="Search system..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                    />
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-md">
                    AD
                </div>
            </div>
        </header>

        {/* Content Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
