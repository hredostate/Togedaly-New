
import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../App';
import { getReconRuns, getReconItemsForRun, startReconRun, updateItemStatus, createLedgerTxn } from '../services/reconService';
import type { ReconRun, ReconItem } from '../types';
import { useToasts } from '../components/ToastHost';
import ImportStatementModal from '../components/admin/finance/recon/ImportStatementModal';
import AutoMatchWizard from '../components/admin/finance/recon/AutoMatchWizard';

function RunItems({ runId, onRefresh }: { runId: number, onRefresh: () => void }) {
  const [items, setItems] = useState<ReconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();

  const loadItems = useCallback(() => {
    setLoading(true);
    getReconItemsForRun(runId)
        .then(setItems)
        .catch(() => addToast({ title: 'Error', desc: 'Failed to load items', emoji: '😥' }))
        .finally(() => setLoading(false));
  }, [runId, addToast]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Expose refresh to parent or triggers
  useEffect(() => { 
      // This allows the parent to trigger a refresh by changing the onRefresh prop/key
      loadItems(); 
  }, [onRefresh, loadItems]);

  async function updateStatus(id: number, status: 'matched' | 'mismatched' | 'resolved') {
    await updateItemStatus(id, status);
    loadItems();
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Items for Run #{runId}</h2>
          <p className="text-xs text-gray-500">
            {items.length} items found
          </p>
        </div>
        <button
          onClick={() => { addToast({title: 'Exporting', desc: 'CSV download started', emoji:'📄'}) }}
          className="text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 transition"
        >
          Export CSV
        </button>
      </div>
      <div className="max-h-[500px] overflow-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-white sticky top-0 shadow-sm z-10">
            <tr>
              <th className="p-3 text-left font-medium text-gray-500">Source</th>
              <th className="p-3 text-left font-medium text-gray-500">Ref</th>
              <th className="p-3 text-left font-medium text-gray-500">Amount</th>
              <th className="p-3 text-left font-medium text-gray-500">Status</th>
              <th className="p-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="odd:bg-gray-50/50 border-b hover:bg-slate-50 transition-colors">
                <td className="p-3">
                    <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded border ${i.source === 'ledger' ? 'bg-blue-50 border-blue-200 text-blue-700' : i.source === 'psp' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                        {i.source}
                    </span>
                </td>
                <td className="p-3 font-mono text-gray-600">{i.external_ref}</td>
                <td className={`p-3 font-medium ${i.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₦{(i.amount / 100).toLocaleString()}
                </td>
                <td className="p-3">
                    <span className={`capitalize px-2 py-1 rounded-md text-[10px] font-medium ${i.status === 'matched' ? 'bg-emerald-100 text-emerald-800' : i.status === 'mismatched' ? 'bg-rose-100 text-rose-800' : i.status === 'resolved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                        {i.status}
                    </span>
                </td>
                <td className="p-3 text-right">
                  {i.status !== 'matched' && i.status !== 'resolved' && (
                      <div className="flex justify-end gap-1">
                        <button
                          className="px-2 py-1 border rounded-md hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition"
                          onClick={() => updateStatus(i.id, 'matched')}
                          title="Mark as Matched"
                        >
                          Match
                        </button>
                        <button
                          className="px-2 py-1 border rounded-md hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
                          onClick={() => updateStatus(i.id, 'mismatched')}
                          title="Flag Mismatch"
                        >
                          Flag
                        </button>
                        <button
                          className="px-2 py-1 border rounded-md hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition"
                          onClick={() => updateStatus(i.id, 'resolved')}
                          title="Resolve Issue"
                        >
                          Resolve
                        </button>
                      </div>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-8 text-center text-gray-400" colSpan={5}>
                  No items yet. Use "Import Statement" to load data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReconciliationPage({ orgId, setPage }: { orgId: string; setPage: (page: Page, context?: any) => void }) {
  const [runs, setRuns] = useState<ReconRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // To force item refresh
  
  const [showImport, setShowImport] = useState(false);
  const [showAutoMatch, setShowAutoMatch] = useState(false);
  
  const { add: addToast } = useToasts();

  const loadRuns = useCallback(async () => {
      setLoadingRuns(true);
      try {
          const data = await getReconRuns(Number(orgId));
          setRuns(data);
          if (!selectedRunId && data.length > 0) {
              setSelectedRunId(data[0].id);
          }
      } catch (e: any) {
          addToast({ title: 'Error', desc: 'Could not load runs.', emoji: '😥' });
      } finally {
          setLoadingRuns(false);
      }
  }, [orgId, selectedRunId, addToast]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  const handleStartRun = async () => {
      try {
          const newRun = await startReconRun(Number(orgId));
          addToast({ title: 'Run Started', desc: `Reconciliation Run #${newRun.id} created.`, emoji: '🚀' });
          await loadRuns();
          setSelectedRunId(newRun.id);
      } catch (e: any) {
          addToast({ title: 'Error', desc: 'Could not start run.', emoji: '😥' });
      }
  };

  const refreshItems = () => setRefreshKey(k => k + 1);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Reconciliation Console</h1>
          <p className="text-sm text-gray-500">
            Match PSP, ledger, and bank records. Detect discrepancies.
          </p>
        </div>
        <div className="flex gap-2">
            {selectedRunId && (
                <>
                    <button
                        onClick={() => setShowImport(true)}
                        className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition"
                    >
                        Import Statement
                    </button>
                    <button
                        onClick={() => setShowAutoMatch(true)}
                        className="px-4 py-2 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition"
                    >
                        Auto-Match
                    </button>
                </>
            )}
            <button
              onClick={handleStartRun}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              Start New Run
            </button>
        </div>
      </header>

      <section className="grid md:grid-cols-[280px,1fr] gap-6 flex-grow min-h-0">
        {/* Left: Run List */}
        <div className="border rounded-xl bg-white flex flex-col overflow-hidden shadow-sm">
          <div className="border-b px-4 py-3 bg-slate-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Run History
          </div>
          <div className="overflow-y-auto flex-1">
            {loadingRuns && <div className="p-4 text-center text-sm text-gray-500">Loading...</div>}
            {!loadingRuns && runs.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRunId(r.id)}
                className={`w-full text-left px-4 py-3 border-b last:border-0 transition-colors ${
                  selectedRunId === r.id
                    ? 'bg-slate-50 border-l-4 border-l-brand'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-sm ${selectedRunId === r.id ? 'text-brand' : 'text-gray-800'}`}>#{r.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(r.started_at).toLocaleString()}
                </div>
              </button>
            ))}
            {!loadingRuns && runs.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">No runs found. Start one to begin.</div>
            )}
          </div>
        </div>

        {/* Right: Items & Workspace */}
        <div className="flex flex-col min-h-0">
          {selectedRunId ? (
            <RunItems runId={selectedRunId} onRefresh={refreshItems} />
          ) : (
            <div className="border rounded-xl bg-slate-50 flex items-center justify-center h-full text-gray-400 text-sm">
              Select a run to view details
            </div>
          )}
        </div>
      </section>

      {showImport && selectedRunId && (
          <ImportStatementModal 
            runId={selectedRunId} 
            onClose={() => setShowImport(false)} 
            onSuccess={() => { setShowImport(false); refreshItems(); }} 
          />
      )}

      {showAutoMatch && selectedRunId && (
          <AutoMatchWizard 
            runId={selectedRunId} 
            onClose={() => setShowAutoMatch(false)} 
            onSuccess={() => { setShowAutoMatch(false); refreshItems(); }} 
          />
      )}
    </div>
  );
}
