
import { NextRequest, NextResponse } from 'next/server';
import { runOnce } from '../../../../jobs/aiNudge.worker';

export async function POST(_req: NextRequest){
  try {
    const r = await runOnce();
    return NextResponse.json(r);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
