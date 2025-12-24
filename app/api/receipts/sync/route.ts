
// app/api/receipts/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Very simple example: store in ops_events or a dedicated receipts table
    const { error } = await sb.from('ops_events').insert({
        org_id: body.orgId ?? null,
        pool_id: body.poolId ?? null,
        level: 'info',
        code: 'RECEIPT_SYNC',
        message: 'Receipt synced from PWA background',
        meta: body.meta ?? body,
    });

    if (error) {
        console.error(error);
        return new NextResponse('Failed', { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
