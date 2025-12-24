
'use client';
import React, { useState, useEffect } from 'react';
import { Card, Grid } from './Cards';
import { DataTable } from './DataTable';
import { getArrearsRecords } from '../../../services/opsService';
import { getLiquidityPositions } from '../../../services/treasuryService';
import { getReconRuns } from '../../../services/reconService';
import { getMonitoringStats } from '../../../services/monitoringService';
import type { ArrearsRecord, LiquidityPosition, ReconRun } from '../../../types';
import type { MonitoringStats } from '../../../services/monitoringService';

export default function OpsOverview(){
  const [arrears, setArrears] = useState<ArrearsRecord[]>([]);
  const [liq, setLiq] = useState<LiquidityPosition[]>([]);
  const [reconRuns, setReconRuns] = useState<ReconRun[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      setLoading(true);
      Promise.all([
          getArrearsRecords(),
          getLiquidityPositions(),
          getReconRuns(1), // Mock Org ID 1
          getMonitoringStats(),
      ]).then(([arrearsData, liqData, reconData, monitoringData]) => {
          setArrears(arrearsData);
          setLiq(liqData);
          setReconRuns(reconData);
          setMonitoring(monitoringData);
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading overview...</div>;

  const totalArrears = (arrears||[]).reduce((a,c)=> a + Number(c.total_owed||0), 0);
  const openDebtors = (arrears||[]).length;
  const cap = (liq||[]).reduce((a,c)=> a + Number(c.draw_capacity||0), 0);

  return (
    <div className="grid gap-6">
      <Grid>
        <Card title="Open Debtors" value={openDebtors} hint="v_member_arrears"/>
        <Card title="Total Arrears (₦)" value={totalArrears.toLocaleString()} />
        <Card title="Draw Capacity (₦)" value={cap.toLocaleString()} hint="v_liquidity_position"/>
        <Card title="Webhook Success (24h)" value={`${((monitoring?.webhookSuccessRate || 0) * 100).toFixed(1)}%`} hint="paystack webhooks"/>
        <Card title="Queue Depth (Nudges)" value={monitoring?.queueDepth.toLocaleString() || '0'} hint="bullmq:nudges"/>
        <Card title="API P95 Latency (ms)" value={monitoring?.apiP95 || '0'} hint="api routes"/>
      </Grid>

      <section>
        <h2 className="text-xl font-semibold mb-2">Recent Reconciliation Runs</h2>
        <DataTable rows={reconRuns||[]} cols={[ 'id','status','started_at','ended_at' ]} />
      </section>
    </div>
  );
}
