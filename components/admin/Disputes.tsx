import React, { useState, useEffect } from 'react';
import type { Dispute, DisputeStatus } from '../../types';
import { getAdminDisputes, updateAdminDispute } from '../../services/standingService';
import { useToasts } from '../ToastHost';
import DisputeDrawer from './DisputeDrawer';

const AdminDisputes: React.FC = () => {
  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DisputeStatus | 'all'>('open');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const { add: addToast } = useToasts();

  const load = async () => { 
      setLoading(true);
      try {
          const items = await getAdminDisputes({ status: filter });
          setRows(items);
      } catch (e: any) {
          addToast({ title: 'Error', desc: e.message || 'Could not load disputes.', emoji: '😥' });
      } finally {
          setLoading(false);
      }
  };
  
  useEffect(() => { load() }, [filter]);

  // Quick-update functionality is kept, but drawer provides more detail
  async function update(d: Dispute, status: DisputeStatus) {
    try {
      await updateAdminDispute(d.id, { status });
      addToast({ title: 'Status Updated', desc: `Dispute moved to ${status}.`, emoji: '✅' });
      load();
    } catch (e: any) {
      addToast({ title: 'Error', desc: e.message, emoji: '😥' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Disputes Review Queue</div>
      <div className="rounded-2xl p-3 bg-white border flex items-center gap-3">
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="border rounded-xl px-3 py-2 text-sm bg-white">
          <option value="open">Open</option>
          <option value="in_review">In review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded-xl border text-sm hover:bg-slate-100">Refresh</button>
      </div>
      <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left border-b">
            <tr>
                <th className="p-3">When</th><th className="p-3">User</th><th className="p-3">Kind</th>
                <th className="p-3">Ref</th><th className="p-3">Status</th><th className="p-3">Title</th>
                <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading disputes...</td></tr>}
            {!loading && rows.map((d: any) => (
              <tr key={d.id} className="border-b">
                <td className="p-3">{new Date(d.created_at).toLocaleString()}</td>
                <td className="p-3 font-mono text-[11px]">{d.user_id}</td>
                <td className="p-3 capitalize">{d.kind}</td>
                <td className="p-3 font-mono text-[11px]">{d.ref || '—'}</td>
                <td className="p-3 capitalize">{d.status.replace('_', ' ')}</td>
                <td className="p-3 font-medium">
                  <button onClick={() => setSelectedDispute(d)} className="hover:underline text-left">
                    {d.title}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => update(d, 'in_review')} className="px-2 py-1 rounded-lg border text-xs">Review</button>
                    <button onClick={() => update(d, 'resolved')} className="px-2 py-1 rounded-lg border text-xs">Resolve</button>
                    <button onClick={() => update(d, 'rejected')} className="px-2 py-1 rounded-lg border text-xs">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No disputes match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
      <DisputeDrawer 
        dispute={selectedDispute}
        onClose={() => setSelectedDispute(null)}
        onUpdate={() => {
            setSelectedDispute(null);
            load(); // Refresh the list
        }}
      />
    </div>
  );
};

export default AdminDisputes;