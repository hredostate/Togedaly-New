import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '../../../../supabaseClient';

// This is a placeholder for a Next.js API route.
// In a real app, this would be protected by admin-level authentication.
export async function GET(){
  try {
    // Fetches all profiles that are not verified yet for admin review.
    const { data, error } = await sb.from('kyc_profiles').select('*').neq('status','verified');
    if (error) throw error; 
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
