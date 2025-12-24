import React, { useState } from 'react';
import type { Page } from '../App';
import Incidents from '../components/admin/ops/Incidents';
import Dlq from '../components/admin/ops/Dlq';
import Overview from '../components/admin/ops/Overview';
import Arrears from '../components/admin/ops/Arrears';
import Liquidity from '../components/admin/ops/Liquidity';
import Recon from '../components/admin/ops/Recon';

type OpsTab = 'overview' | 'arrears' | 'liquidity' | 'recon' | 'incidents' | 'dlq';

const Ops: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const [tab, setTab] = useState<OpsTab>('overview');
  
  const NavLink: React.FC<{ id: OpsTab, children: React.ReactNode }> = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-brand text-white' : 'hover:bg-brand-50'}`}
    >
      {children}
    </button>
  );

  const renderContent = () => {
    switch (tab) {
        case 'overview': return <Overview />;
        case 'arrears': return <Arrears />;
        case 'liquidity': return <Liquidity />;
        case 'recon': return <Recon />;
        case 'incidents': return <Incidents />;
        case 'dlq': return <Dlq />;
        default: return null;
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setPage('admin')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Admin</button>
      <h2 className="text-xl font-semibold">Operations Dashboard</h2>
      <div className="rounded-2xl border bg-white p-2 flex flex-wrap gap-2">
        <NavLink id="overview">Overview</NavLink>
        <NavLink id="arrears">Arrears</NavLink>
        <NavLink id="liquidity">Liquidity</NavLink>
        <NavLink id="recon">Reconciliation</NavLink>
        <NavLink id="incidents">Incidents</NavLink>
        <NavLink id="dlq">Dead-Letter Queue</NavLink>
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Ops;