import { NextResponse } from 'next/server';
import { markFailed } from '../../../../services/payoutsService';

// This file is repurposed to provide the markFailed functionality from the service layer.
// Simulates: /api/payouts/[instrId]/mark-failed/route.ts
export async function POST(req: Request){
  try {
    const { instrId, reason } = await req.json();
    await markFailed(Number(instrId), reason);
    return NextResponse.json({ ok:true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
