import { NextResponse } from 'next/server';
import { deferPayout } from '../../../../services/payoutsService';

// Simulates: /api/payouts/[instrId]/defer/route.ts
// Adapted to a flat route for this environment
export async function POST(req: Request) {
    try {
        const { instrId, reason } = await req.json();
        await deferPayout(Number(instrId), reason);
        return NextResponse.json({ ok:true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
