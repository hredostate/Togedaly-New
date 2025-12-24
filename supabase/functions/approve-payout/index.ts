import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Initialize Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Authenticate User from Request Header
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) throw new Error('Unauthorized')

    // 3. Verify Admin Role (RBAC)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
      throw new Error('Forbidden: Insufficient permissions')
    }

    // 4. Parse Request
    const { payoutId } = await req.json()

    // 5. Perform Atomic Approval
    // We use a stored procedure or direct update here
    const { data: payout, error: updateError } = await supabase
      .from('payout_instructions')
      .update({ 
        status: 'queued', // Move to queued for payment processing
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', payoutId)
      .eq('status', 'pending') // Optimistic locking: ensure it's still pending
      .select()
      .single()

    if (updateError || !payout) {
      throw new Error('Approval failed: Payout not found or already processed')
    }

    // 6. Log Audit Trail
    await supabase.from('audit_logs').insert({
      actor: user.id,
      action: 'payout.approve',
      target: `payout:${payoutId}`,
      meta: { amount: payout.amount }
    })

    return new Response(
      JSON.stringify({ ok: true, payout }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})