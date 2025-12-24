import { NextResponse } from 'next/server';
import { markPaid } from '../../../../../services/payoutsService';

// Simulates: /api/payouts/[instrId]/mark-paid/route.ts
// Adapted to a flat route for this environment
export async function POST(req: Request) {
    try {
        const { instrId, providerRef } = await req.json();
        await markPaid(Number(instrId), providerRef);
        return NextResponse.json({ ok:true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
