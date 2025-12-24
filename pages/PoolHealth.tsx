
import React from 'react';
import useSWR from 'swr';
import type { Page } from '../App';
import { getPools } from '../services/poolService';

const PoolHealth: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const { data: pools, isLoading } = useSWR('all-pools', getPools);

  // TODO: Add real pool health metrics calculation
  // This should fetch actual health scores from database based on:
  // - Member payment history
  // - Trust scores
  // - Arrears data
  // For now, we calculate a simple health score from pool data
  const poolsWithHealth = pools?.map(pool => ({
    id: pool.id,
    name: pool.name,
    members: pool.member_count || 0,
    health: 92 // Placeholder: should be calculated from real metrics
  })) || [];

  return (
    <div className="space-y-4">
      <button onClick={() => setPage('admin')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Admin</button>
      <h2 className="text-xl font-semibold">TrustPool Health</h2>
      
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold text-lg">Pool Overview</h3>
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading pools...</div>
        ) : poolsWithHealth.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">No pools found.</div>
        ) : (
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
                    {poolsWithHealth.map(p => (
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
        )}
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