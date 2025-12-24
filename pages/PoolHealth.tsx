
import React from 'react';
import type { Page } from '../App';

const PoolHealth: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  // Mock data to demonstrate the new "Manage" button
  const mockPools = [
      { id: '1', name: '₦20k Weekly Ajo', members: 12, health: 95 },
      { id: '2', name: 'Epe Land Banking', members: 8, health: 88 },
  ];

  return (
    <div className="space-y-4">
      <button onClick={() => setPage('admin')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Admin</button>
      <h2 className="text-xl font-semibold">TrustPool Health</h2>
      
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold text-lg">Pool Overview</h3>
        <div className="rounded-2xl overflow-auto border bg-white mt-2">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left border-b">
                    <tr>
                        <th className="p-3">Pool Name</th>
                        <th className="p-3">Members</th>
                        <th className="p-3">Health Score</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mockPools.map(p => (
                        <tr key={p.id} className="border-b">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3">{p.members}</td>
                            <td className="p-3">{p.health}%</td>
                            <td className="p-3">
                                <button 
                                    onClick={() => setPage('treasury', { poolId: p.id, orgId: 'org-123' })}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-700 transition"
                                >
                                    Manage
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <p className="text-sm text-gray-500 text-center py-8">
            Other Pool Health metrics (Member Arrears, Trust Scores) would be displayed here.
        </p>
      </div>
    </div>
  );
};

export default PoolHealth;