// app/api/invoices/link-payout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { linkPayoutToInvoice } from '../../../../services/disbursementService';

// This is a placeholder for a Next.js API route.
export async function POST(req:NextRequest, { params }:{ params:{ invoiceId:string }}){
    try {
        const { payoutId, amount } = await req.json();
        // In a real app, invoiceId would come from params. Here, we get it from the body for simplicity.
        const { invoiceId } = await req.json();
        await linkPayoutToInvoice(Number(invoiceId), Number(payoutId), Number(amount));
        return NextResponse.json({ ok:true });
    } catch(e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
