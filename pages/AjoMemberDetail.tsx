import React, { useEffect, useState } from 'react';
import type { Page } from '../App';
import type { AjoMemberDetails, TtfEntry, AjoMemberTimelineEntry, NotificationChannel } from '../types';
import { getAjoMemberTimeline, remindAjoMember } from '../services/analyticsService';
import { useToasts } from '../components/ToastHost';

const AjoMemberDetail: React.FC<{ member: (AjoMemberDetails | TtfEntry | { user_id: string, group_id: string }) & { member_name?: string }; setPage: (page: Page, context?: any) => void }> = ({ member, setPage }) => {
  const [timeline, setTimeline] = useState<AjoMemberTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<NotificationChannel>('sms');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const { add: addToast } = useToasts();

  useEffect(() => {
    if (!member.user_id) return;
    setLoading(true);
    getAjoMemberTimeline(member.group_id, member.user_id)
        .then(setTimeline)
        .catch(() => addToast({ title: 'Error', desc: 'Could not load member timeline.', emoji: '😥' }))
        .finally(() => setLoading(false));
  }, [member.group_id, member.user_id, addToast]);
  
  const handleSendReminder = async () => {
      if (!member.user_id) return;
      setSending(true);
      try {
          await remindAjoMember(member.group_id, member.user_id, channel, body, 'naija');
          addToast({ title: 'Reminder Queued', desc: 'The message has been sent for delivery.', emoji: '🚀'});
          setBody('');
      } catch (e: any) {
          addToast({ title: 'Error', desc: e.message || 'Could not send reminder.', emoji: '😥' });
      } finally {
          setSending(false);
      }
  };
  
  const charLimit = channel === 'sms' ? 160 : 1000;
  const isOverLimit = body.length > charLimit;

  return (
    <div className="space-y-4">
       <button onClick={() => setPage('ajoGroupDetail', { group: { group_id: member.group_id }})} className="text-sm text-gray-600 hover:text-brand transition">← Back to Group Detail</button>
      <div className="rounded-2xl p-4 bg-white border shadow-sm">
        <div className="text-sm text-gray-500">Member Timeline</div>
        <div className="text-2xl font-semibold">{member.member_name || member.user_id}</div>
        <div className="text-sm text-gray-600">{loading ? 'Loading records...' : `${timeline.length} payment records found`}</div>
      </div>

      {/* Minimal composer controls for the Playwright test */}
      <div className="rounded-2xl p-4 bg-white border shadow-sm">
        <h3 className="font-semibold mb-2">Send Reminder</h3>
        <label className="text-xs text-gray-500 block mb-1">Channel</label>
        <select value={channel} onChange={e => setChannel(e.target.value as NotificationChannel)} className="border rounded-xl px-3 py-2 text-sm bg-white">
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>

        <label className="text-xs text-gray-500 block mt-3 mb-1">Message</label>
        <textarea rows={3} value={body} onChange={e => setBody(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <div className={`text-xs text-right ${isOverLimit ? 'text-rose-500' : 'text-gray-500'}`}>{body.length} / {charLimit}</div>

        <button onClick={handleSendReminder} disabled={sending || isOverLimit || body.length === 0} className="mt-3 px-3 py-2 rounded-xl bg-brand text-white disabled:opacity-50">
          {sending ? 'Sending...' : 'Queue Reminder'}
        </button>
      </div>

       <div className="rounded-2xl overflow-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr className="border-b">
                <th className="p-3">Due Date</th><th className="p-3">Status</th><th className="p-3">Paid At</th><th className="p-3">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading timeline...</td></tr>}
            {!loading && timeline.map((t, i) => (
                <tr key={i} className="border-b">
                    <td className="p-3">{new Date(t.due_date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium capitalize">{t.status.replace('_', ' ')}</td>
                    <td className="p-3">{t.paid_at ? new Date(t.paid_at).toLocaleString() : '—'}</td>
                    <td className="p-3">{ (t.amount_kobo / 100).toLocaleString() }</td>
                </tr>
            ))}
            {!loading && timeline.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No payment history found for this member.</td></tr>}
          </tbody>
        </table>
       </div>
    </div>
  )
}

export default AjoMemberDetail;