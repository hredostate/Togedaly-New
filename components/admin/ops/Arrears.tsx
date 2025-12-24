
'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from './DataTable';
import { getArrearsRecords } from '../../../services/opsService';
import type { ArrearsRecord } from '../../../types';

export default function ArrearsPage(){
  const [data, setData] = useState<ArrearsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    getArrearsRecords().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading arrears...</div>;

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Member Arrears</h2>
      <DataTable rows={data||[]} cols={[ 'org_id','pool_id','user_id','open_cycles','total_owed' ]}/>
    </div>
  );
}