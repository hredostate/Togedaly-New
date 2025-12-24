'use client';
import React, { useState, useEffect } from 'react';

const fetcher = (url:string) => fetch(url).then(r=>r.json());

export default function ReputationCard({ orgId, userId }:{ orgId:number; userId:string }){
  const [row, setRow] = useState<any>(null);

  useEffect(() => {
    // Mocking useSWR behavior and admin API
    const loadData = async () => {
        // This is a placeholder for a real API call to `/api/admin/${orgId}/trust-breakdown`
        await new Promise(res => setTimeout(res, 500));
        const mockData = [
            { user_id: 'mock-user-id', trust_score: 85, score_peer: 20, score_on_time: 50, score_misses: -5, score_tenure: 20 },
            { user_id: 'user-002', trust_score: 72, score_peer: 15, score_on_time: 40, score_misses: 0, score_tenure: 17 },
        ];
        setRow(mockData.find((r:any)=> r.user_id===userId));
    };
    loadData();
  }, [orgId, userId]);
  
  if(!row) return null;
  return (
    <div className="rounded-2xl p-4 shadow bg-white border">
      <div className="text-sm text-gray-500">Trust Score</div>
      <div className="text-3xl font-bold">{row.trust_score}</div>
      <div className="text-xs mt-2">Peer: {row.score_peer} | On‑time: {row.score_on_time} | Misses: {row.score_misses}</div>
    </div>
  );
}
