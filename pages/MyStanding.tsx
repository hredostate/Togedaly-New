
import React, { useState } from 'react';
import type { Page } from '../App';
import DisputesTab from '../components/standing/DisputesTab';
import DefaultEventsTab from '../components/standing/DefaultEventsTab';
import RefinanceTab from '../components/standing/RefinanceTab';
import TrustScoreTab from '../components/standing/TrustScoreTab';
import ReputationTab from '../components/standing/ReputationTab';
import SupportTab from '../components/standing/SupportTab';

type StandingTab = 'disputes' | 'defaults' | 'refinance' | 'trust' | 'reputation' | 'support';

const MyStanding: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [tab, setTab] = useState<StandingTab>('disputes');

    const NavLink: React.FC<{ id: StandingTab, children: React.ReactNode }> = ({ id, children }) => (
        <button
            onClick={() => setTab(id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-brand text-white' : 'hover:bg-brand-50'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-4">
            <button onClick={() => setPage('dashboard')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Dashboard</button>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Standing</h2>
                {tab === 'disputes' && (
                    <button onClick={() => setPage('disputes')} className="text-sm text-brand font-medium hover:underline">
                        View All Disputes &rarr;
                    </button>
                )}
            </div>
            
            <div className="rounded-2xl border bg-white p-2 flex flex-wrap gap-2">
                <NavLink id="disputes">Disputes</NavLink>
                <NavLink id="defaults">Default Events</NavLink>
                <NavLink id="refinance">Refinance</NavLink>
                <NavLink id="trust">Trust Score</NavLink>
                <NavLink id="reputation">Reputation</NavLink>
                <NavLink id="support">Support</NavLink>
            </div>
            <div>
                {tab === 'disputes' && <DisputesTab />}
                {tab === 'defaults' && <DefaultEventsTab />}
                {tab === 'refinance' && <RefinanceTab setPage={setPage} />}
                {tab === 'trust' && <TrustScoreTab />}
                {tab === 'reputation' && <ReputationTab />}
                {tab === 'support' && <SupportTab />}
            </div>
        </div>
    );
};

export default MyStanding;
