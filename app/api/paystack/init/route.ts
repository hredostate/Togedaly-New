
import { NextRequest, NextResponse } from 'next/server';
import { initializeTransaction } from '../../../../lib/paystack';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, amount, userId, splitCode } = body;

        // In a real app, verify user session here.

        // Initialize with Paystack (Server Side)
        // We pass the userId in metadata for webhook reconciliation
        const result = await initializeTransaction(
            email, 
            amount, 
            `${req.nextUrl.origin}/wallet`, // Callback URL
            { userId },
            splitCode
        );

        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Paystack Init Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
