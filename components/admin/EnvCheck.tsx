import React, { useState, useEffect } from 'react';
import { checkEnvironment } from '../../services/adminService';
import { useToasts } from '../ToastHost';

const EnvCheck: React.FC = () => {
  const [state, setState] = useState<{ ok: boolean, results: { key: string, ok: boolean }[], warnings: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();

  useEffect(() => {
    setLoading(true);
    checkEnvironment()
        .then(setState)
        .catch(() => addToast({ title: 'Error', desc: 'Could not run environment check.', emoji: '😥' }))
        .finally(() => setLoading(false));
  }, [addToast]);

  if (loading || !state) return <div className="max-w-2xl mx-auto p-4">Running environment checks...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="text-xl font-semibold">Environment Check</div>
      <div className={`rounded-2xl p-4 border ${state.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="font-medium mb-2">{state.ok ? '✅ All good' : '⚠️ Issues detected'}</div>
        <ul className="list-disc ml-5 text-sm">
          {(state.warnings || []).map((w: string, i: number) => <li key={i} className="text-amber-800">{w}</li>)}
          {(!state.warnings || state.warnings.length === 0) && <li className="text-emerald-800">No warnings. Required environment variables are present.</li>}
        </ul>
      </div>
      <div className="rounded-2xl overflow-hidden border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b">
              <th className="p-2 text-left font-semibold">Key</th>
              <th className="p-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.results.map((r: any) => (
              <tr key={r.key} className="border-b">
                <td className="p-2 font-mono text-xs">{r.key}</td>
                <td className={`p-2 font-semibold ${r.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{r.ok ? 'OK' : 'Missing'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnvCheck;
