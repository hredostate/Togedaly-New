import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '../../../../supabaseClient';

// This is a placeholder for a Next.js API route.
// In a real app, this would be protected by admin-level authentication.
export async function POST(req: NextRequest){
  try {
    const { userId, decision, reason } = await req.json();

    if (!userId || !['verified','rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid input: requires userId and a valid decision ("verified" or "rejected").' }, { status: 400 });
    }
    
    const { error } = await sb.from('kyc_profiles').upsert({ 
        user_id: userId, 
        status: decision, 
        data: { manual_reason: reason, decided_by: 'admin_id_from_session' } // Enrich data
    });
    
    if (error) throw error;
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
