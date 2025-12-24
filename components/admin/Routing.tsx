// components/admin/Routing.tsx
import React, { useState } from 'react';
import RoutingSettings from './RoutingSettings';
import RoutingReport from './reports/RoutingReport';

type RoutingSubPage = 'settings' | 'reports';

const Routing: React.FC = () => {
    const [subPage, setSubPage] = useState<RoutingSubPage>('settings');

    const NavLink: React.FC<{ id: RoutingSubPage, children: React.ReactNode }> = ({ id, children }) => (
        <button
            onClick={() => setSubPage(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${subPage === id ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-3 bg-white border flex items-center gap-2">
                <NavLink id="settings">Settings</NavLink>
                <NavLink id="reports">Reports</NavLink>
            </div>
            <div>
                {subPage === 'settings' && <RoutingSettings />}
                {subPage === 'reports' && <RoutingReport />}
            </div>
        </div>
    );
};

export default Routing;
