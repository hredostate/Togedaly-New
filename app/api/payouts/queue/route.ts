// app/api/payouts/queue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queuePayout } from '../../../../services/disbursementService';

// This is a placeholder for a Next.js API route.
export async function POST(req:NextRequest){
  try {
    const body = await req.json();
    const payout = await queuePayout(body);
    return NextResponse.json(payout);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
