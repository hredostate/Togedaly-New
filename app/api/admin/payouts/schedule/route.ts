import { NextResponse } from 'next/server';
import { generateRun } from '../../../../services/payoutsService';

// Simulates: /api/pools/[poolId]/cycles/[cycleId]/payouts/generate/route.ts
// Adapted to a flat route for this environment
export async function POST(req: Request){
  try {
    const { poolId, cycleId } = await req.json();
    const actor = 'mock-admin-id'; // In real app, from session
    const runId = await generateRun(Number(poolId), Number(cycleId), actor);
    return NextResponse.json({ runId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
