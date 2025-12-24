import React, { useState, useEffect } from 'react';
import { getNudgeStats, sendTestNudge } from '../../services/nudgeService';
import { useToasts } from '../ToastHost';
// FIX: Module '"../../types"' has no exported member 'NudgeChannel'. The type was renamed to 'NotificationChannel', aliasing here for compatibility.
import type { NudgeStat, NotificationChannel as NudgeChannel } from '../../types';

const TestNudgeSender: React.FC<{ onSent: () => void }> = ({ onSent }) => {
    const [submitting, setSubmitting] = useState(false);
    const [channel, setChannel] = useState<NudgeChannel>('push');
    const { add: addToast } = useToasts();
    
    const handleSend = async () => {
        setSubmitting(true);
        try {
            const nudge = await sendTestNudge('mock-user-id', 'repayment_reminder_v1', channel);
            addToast({ title: 'Test Nudge Sent', desc: `Sent to ${nudge.user_id} via ${nudge.channel}`, emoji: '🧪' });
            if (nudge.channel === 'voice' && nudge.tts_url) {
                // In a real app, you'd play the audio. Here, we just log it.
                console.log("TTS URL:", nudge.tts_url);
                addToast({ title: 'Voice Generated', desc: 'Check console for mock audio URL.', emoji: '🔊'});
            }
            onSent();
        } catch (e: any) {
            addToast({ title: 'Send Failed', desc: e.message, emoji: '😥' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-lg">Test Nudge</h3>
            <div className="flex gap-2 items-center mt-2">
                <select value={channel} onChange={e => setChannel(e.target.value as NudgeChannel)} className="border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="push">Push</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="voice">Voice</option>
                    <option value="inapp">In-App</option>
                </select>
                <button onClick={handleSend} disabled={submitting} className="px-3 py-2 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50">
                    {submitting ? 'Sending...' : 'Send Test Repayment Nudge'}
                </button>
            </div>
        </div>
    );
};


const NudgeAdmin: React.FC = () => {
  const [stats, setStats] = useState<NudgeStat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = () => {
      setLoading(true);
      getNudgeStats().then(setStats).finally(() => setLoading(false));
  };
  
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-4">
      <TestNudgeSender onSent={loadStats} />
      <div className="overflow-auto border rounded-2xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
                {['Experiment', 'Bucket', 'Sent', 'Clicks', 'Repayments', 'Joins', 'CTR %'].map(c => 
                    <th key={c} className="p-2 text-left font-semibold">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading stats...</td></tr>
            ) : (stats||[]).map((r:any,i:number)=>(
                <tr key={i} className="odd:bg-gray-50 border-b">
                    <td className="p-2 whitespace-nowrap">{r.key}</td>
                    <td className="p-2 whitespace-nowrap font-semibold">{r.bucket}</td>
                    <td className="p-2 whitespace-nowrap">{r.nudges_sent}</td>
                    <td className="p-2 whitespace-nowrap">{r.clicks}</td>
                    <td className="p-2 whitespace-nowrap">{r.repayments}</td>
                    <td className="p-2 whitespace-nowrap">{r.joins}</td>
                    <td className="p-2 whitespace-nowrap">{r.ctr_pct}%</td>
                </tr>
            ))}
            {!loading && (!stats || stats.length === 0) && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No experiment data found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NudgeAdmin;