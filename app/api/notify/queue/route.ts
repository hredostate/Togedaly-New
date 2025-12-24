// app/api/notify/queue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runNotifyQueue } from '../../../../jobs/notify.worker';

// This is a placeholder for a Next.js environment.
export async function POST(){ 
    try {
        await runNotifyQueue(); 
        return NextResponse.json({ ok:true }); 
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
