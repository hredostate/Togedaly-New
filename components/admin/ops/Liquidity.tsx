
'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from './DataTable';
import { getLiquidityPositions } from '../../../services/treasuryService';
import type { LiquidityPosition } from '../../../types';

export default function LiquidityPage(){
  const [data, setData] = useState<LiquidityPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLiquidityPositions().then(setData).finally(() => setLoading(false));
  }, []);
  
  if (loading) return <div>Loading liquidity positions...</div>;

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Liquidity Position</h2>
      <DataTable rows={data||[]} cols={[ 'org_id','pool_id','total_locked','max_draw_pct','min_reserve_pct','vol_buf','next_14d_due','pending_draws','draw_capacity' ]}/>
    </div>
  );
}