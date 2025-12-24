
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Notification } from '../../types';
import { getAdminNotificationsList } from '../../services/notificationService';
import { useToasts } from '../ToastHost';
import { ChannelChips } from '../notifications/ChannelChips';
import { SendAfterBadge } from '../notifications/SendAfterBadge';

const NotificationsConsole: React.FC = () => {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'queued' | 'sent' | 'failed' | 'skipped'>('all');
  const { add: addToast } = useToasts();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getAdminNotificationsList();
      setRows(items);
    } catch (e: any) {
      addToast({ title: 'Error', desc: e.message || 'Could not load notifications', emoji: '😥' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load() }, [load]);

  const filtered = useMemo(() => (rows || []).filter((n: any) => {
    const matchesQ = !q || String(n.id).includes(q) || String(n.title || '').toLowerCase().includes(q.toLowerCase());
    const matchesS = status === 'all' || n.delivery_status === status;
    return matchesQ && matchesS;
  }), [rows, q, status]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 bg-white border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="Search by id or title" 
            className="border rounded-xl px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent" 
            style={{ backgroundColor: '#ffffff', color: '#111827' }}
          />
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-xl border text-sm hover:bg-slate-100">Refresh</button>
      </div>

      <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr className="border-b">
              <th className="p-3">ID</th>
              <th className="p-3">Title</th>
              <th className="p-3">Channels</th>
              <th className="p-3">Status</th>
              <th className="p-3">Send After</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading notifications...</td></tr>
            ): filtered.map((n: any) => (
              <tr key={n.id} className="align-top border-b">
                <td className="p-3 font-mono text-[11px]">{n.id.slice(0, 12)}...</td>
                <td className="p-3">
                  <div className="font-medium text-[13px]">{n.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[420px]">{n.body || '—'}</div>
                </td>
                <td className="p-3"><ChannelChips channels={n.delivery_channels} /></td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-lg border text-xs capitalize ${n.delivery_status === 'queued' ? 'bg-amber-50' : n.delivery_status === 'sent' ? 'bg-emerald-50' : n.delivery_status === 'failed' ? 'bg-rose-50' : 'bg-slate-50'}`}>{n.delivery_status}</span>
                </td>
                <td className="p-3"><SendAfterBadge ts={n.deferred_until} /></td>
                <td className="p-3">{new Date(n.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No notifications match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotificationsConsole;