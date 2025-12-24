
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from './DataTable';
import { useToasts } from '../../ToastHost';
import { getReconRuns, getReconItems, startReconRun, matchReconItem, resolveReconItem } from '../../../services/reconService';
import type { ReconRun, ReconItem } from '../../../types';

export default function Recon(){
  const [runs, setRuns] = useState<ReconRun[]>([]);
  const [items, setItems] = useState<ReconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();

  const loadData = useCallback(async () => {
      setLoading(true);
      try {
          // Pass mock orgId = 1
          const [runsData, itemsData] = await Promise.all([getReconRuns(1), getReconItems()]);
          setRuns(runsData);
          setItems(itemsData);
      } catch (e: any) {
          addToast({ title: 'Error', desc: 'Could not load reconciliation data.', emoji: '😥' });
      } finally {
          setLoading(false);
      }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  async function handleStartRun(){ 
    // Pass mock orgId = 1
    await startReconRun(1);
    addToast({ title: 'Success', desc: 'New reconciliation run started.', emoji: '🚀' });
    loadData();
  }
  
  async function exportCSV(){ 
    addToast({ title: 'Info', desc: 'CSV export would start here.', emoji: '📄' });
    // In a real app with Next.js, this would link to an API route:
    // const a=document.createElement('a'); a.href='/api/ops/recon/export'; a.click(); 
  }

  async function handleMatch(id:number){ 
    await matchReconItem(id);
    addToast({ title: 'Matched', desc: `Item ${id} marked as matched.`, emoji: '✅' });
    loadData();
  }

  async function handleResolve(id:number){ 
    await resolveReconItem(id); 
    addToast({ title: 'Resolved', desc: `Item ${id} marked as resolved.`, emoji: '✅' });
    loadData();
  }

  return (
    <div className="grid gap-6">
      <div className="flex gap-2">
        <button onClick={handleStartRun} className="px-3 py-2 rounded-xl bg-black text-white">Start Run</button>
        <button onClick={exportCSV} className="px-3 py-2 rounded-xl border">Export CSV</button>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-2">Runs</h3>
        <DataTable
          rows={runs||[]}
          cols={[ 'id','status','started_at','ended_at' ]}
        />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Unmatched / Pending Items</h3>
        <DataTable
          rows={(items||[]).filter((x:any)=>!x.matched)}
          cols={[ 'id','source','external_ref','amount','currency','matched' ]}
          actions={(r)=> (
            <div className="flex gap-2">
              <button onClick={()=>handleMatch(r.id)} className="px-2 py-1 rounded border text-xs">Match</button>
              <button onClick={()=>handleResolve(r.id)} className="px-2 py-1 rounded border text-xs">Resolve</button>
            </div>
          )}
        />
      </section>
    </div>
  );
}
