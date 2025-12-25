'use client';
import React, { useState, useEffect } from 'react';

const fetcher = (url:string) => fetch(url).then(r=>r.json());

export default function ReputationCard({ orgId, userId }:{ orgId:number; userId:string }){
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            // TODO: Replace with real API call to `/api/admin/${orgId}/trust-breakdown`
            const response = await fetch(`/api/admin/${orgId}/trust-breakdown?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setRow(data);
            }
        } catch (error) {
            console.error('Failed to load trust score data:', error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [orgId, userId]);
  
  if(loading) return null;
  if(!row) return null;
  return (
    <div className="rounded-2xl p-4 shadow bg-white border">
      <div className="text-sm text-gray-500">Trust Score</div>
      <div className="text-3xl font-bold">{row.trust_score}</div>
      <div className="text-xs mt-2">Peer: {row.score_peer} | On‑time: {row.score_on_time} | Misses: {row.score_misses}</div>
    </div>
  );
}
