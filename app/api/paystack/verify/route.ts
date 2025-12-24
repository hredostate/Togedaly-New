
import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '../../../../lib/paystack';
import { supabaseAdmin as sb } from '../../../../supabaseClient';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reference, userId } = body;

        const result = await verifyTransaction(reference);

        if (result.status === 'success') {
            // Save authorization for recurring billing
            if (result.authorization && result.authorization.reusable) {
                await sb.from('user_profiles').update({
                    paystack_auth: result.authorization
                }).eq('id', userId);
                console.log(`Saved Paystack Auth for user ${userId}`);
            }
            
            return NextResponse.json({ ok: true, data: result });
        } else {
            return NextResponse.json({ ok: false, message: 'Transaction failed' }, { status: 400 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
