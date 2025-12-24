import React, { useState } from 'react';
import VelocityAlerts from './fraud/VelocityAlerts';
import DeviceMatrix from './fraud/DeviceMatrix';

type FraudTab = 'velocity' | 'devices';

const FraudDashboard: React.FC = () => {
    const [tab, setTab] = useState<FraudTab>('velocity');

    const NavLink: React.FC<{ id: FraudTab, children: React.ReactNode }> = ({ id, children }) => (
        <button
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-rose-100 text-rose-800' : 'hover:bg-rose-50'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Fraud & Risk Monitoring</h2>
            <div className="rounded-2xl border bg-white p-2 flex flex-wrap gap-2">
                <NavLink id="velocity">Velocity Alerts</NavLink>
                <NavLink id="devices">Device Matrix</NavLink>
            </div>
            <div>
                {tab === 'velocity' && <VelocityAlerts />}
                {tab === 'devices' && <DeviceMatrix />}
            </div>
        </div>
    );
};

export default FraudDashboard;
