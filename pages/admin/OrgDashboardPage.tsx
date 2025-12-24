
import React from 'react';
import DashboardClient from '../../components/admin/DashboardClient';
import type { Page } from '../../App';

interface OrgDashboardProps {
    setPage: (page: Page) => void;
    // In a real route, params comes from URL. Here we might pass it via context or props.
    orgId?: string; 
}

const OrgDashboardPage: React.FC<OrgDashboardProps> = ({ setPage, orgId = '1' }) => {
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={() => setPage('admin')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Admin</button>
            <h1 className="text-2xl font-bold text-gray-900">Organization #{orgId} Overview</h1>
        </div>
        <DashboardClient orgId={orgId} />
    </div>
  );
}

export default OrgDashboardPage;
