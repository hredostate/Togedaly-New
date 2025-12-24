import { NextRequest, NextResponse } from 'next/server';
import { getPayoutsToday } from '../../../../services/payoutsService';

// Simulates: /api/admin/[orgId]/payouts/today/route.ts
export async function GET(req: NextRequest){
  try {
    const poolId = new URL(req.url).searchParams.get('poolId');
    if (!poolId) throw new Error('poolId is required');
    const data = await getPayoutsToday(Number(poolId));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
