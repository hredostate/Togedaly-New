import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as sb } from '../../../../supabaseClient';
import { verifySmileIdSig, verifyVerifyMeSig } from '../../../../services/kyc/providers';

// This is a placeholder for a Next.js API route.
export async function POST(req: NextRequest){
  try {
    const raw = await req.text();
    const sig = req.headers.get('x-signature') ?? '';
    // In a real app, you might use a URL param or a different header to distinguish providers.
    const provider = req.headers.get('x-kyc-provider') ?? 'smileid';
    
    // 1. Verify Signature
    const ok = provider === 'smileid' ? verifySmileIdSig(raw, sig) : verifyVerifyMeSig(raw, sig);
    if (!ok) return new NextResponse('Invalid signature', { status: 401 });

    // 2. Parse Event and update database
    const evt = JSON.parse(raw);
    
    // The exact structure of `evt` will depend on the provider.
    // We map their payload to our internal structure.
    const userId = evt.userId; // Example: map from provider's user identifier
    const newStatus = evt.result === 'verified' ? 'verified' : (evt.result === 'rejected' ? 'rejected' : 'pending');

    if (!userId) {
        return NextResponse.json({ error: "Missing user identifier in webhook payload" }, { status: 400 });
    }

    await sb.from('kyc_profiles').upsert({ 
        user_id: userId, 
        status: newStatus, 
        last_ref: evt.reference, // Example
        data: evt // Store the full webhook payload for auditing
    });

    // 3. Optional: Trigger notifications, etc.

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
