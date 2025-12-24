import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../supabaseClient';
import { createSmileIdJob, createVerifyMeJob } from '../../../../services/kyc/providers';

// This is a placeholder for a Next.js API route.
// In a real app, this would be a secure, server-only endpoint.
export async function POST(req: NextRequest){
  try {
    const { userId, provider, payload } = await req.json();
    if (!userId || !provider || !payload) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store as pending
    await supabase.from('kyc_profiles').upsert({
      user_id: userId, status: 'pending', provider,
      last_ref: null, data: payload
    });

    // Kick off provider job
    const ref = provider === 'smileid'
      ? await createSmileIdJob(userId, payload)
      : await createVerifyMeJob(userId, payload);

    // Update with the provider's reference
    await supabase.from('kyc_profiles')
      .update({ last_ref: ref })
      .eq('user_id', userId);

    return NextResponse.json({ ok: true, ref });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
