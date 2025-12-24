import React, { useState, useEffect } from 'react';
import type { Page } from '../App';
import type { AjoBoardEntry } from '../types';
import { getAjoBoard } from '../services/analyticsService';
import SimpleChartPlaceholder from '../components/admin/analytics/SimpleChartPlaceholder';
import { useToasts } from '../components/ToastHost';

function pct(x: number){ return `${Math.round(Number(x||0)*100)}%` }

const AjoHealth: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  const [rows, setRows] = useState<AjoBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();
  
  useEffect(() => {
    setLoading(true);
    getAjoBoard()
        .then(setRows)
        .catch(() => addToast({ title: 'Error', desc: 'Could not load Ajo board.', emoji: '😥' }))
        .finally(() => setLoading(false));
  }, [addToast]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ajo Health Board</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 bg-white border"><div className="font-semibold mb-2">On‑Time Payment Ratio (30d)</div><div className="h-48"><SimpleChartPlaceholder title="On-Time Ratio Chart" /></div></div>
        <div className="rounded-2xl p-4 bg-white border"><div className="font-semibold mb-2">New Missed Payments (7d)</div><div className="h-48"><SimpleChartPlaceholder title="Missed Payments Chart" /></div></div>
      </div>
      <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left border-b">
            <tr>
              <th className="p-3">Group</th>
              <th className="p-3">Members</th>
              <th className="p-3">On‑Time %</th>
              <th className="p-3">Missers</th>
              <th className="p-3">Defaulters</th>
              <th className="p-3">Next Due</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading board...</td></tr>
            ): rows.map((r) => (
              <tr key={r.group_id} className="border-b">
                <td className="p-3 font-medium">
                  <button onClick={() => setPage('ajoGroupDetail', { group: r })} className="text-brand underline hover:text-brand-700">
                    {r.title}
                  </button>
                </td>
                <td className="p-3">{r.members}</td>
                <td className="p-3">{pct(r.on_time_ratio)}</td>
                <td className="p-3">{r.missers}</td>
                <td className="p-3">{r.defaulters}</td>
                <td className="p-3">{r.next_due ? new Date(r.next_due).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (<tr><td colSpan={6} className="p-6 text-center text-gray-500">No Ajo groups found.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AjoHealth;
