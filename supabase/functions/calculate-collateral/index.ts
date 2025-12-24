import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { baseAmount, ratio, position, totalSlots } = await req.json()

    if (!baseAmount || !ratio || !position || !totalSlots) {
      throw new Error("Missing required parameters")
    }

    // --- LOGIC START ---
    // Formula: Collateral requirement scales linearly from 100% to 0%.
    // Pos 1 pays 100% of collateral_ratio. 
    // Pos N (Last) pays 0% collateral (The Anchor).
    
    const maxDiscount = 1.0; 
    
    // Calculate factor: 0.0 at start (Pos 1), 1.0 at end (Pos N)
    const positionFactor = totalSlots > 1 
        ? Math.min(1, Math.max(0, (position - 1) / (totalSlots - 1))) 
        : 0; 
        
    // Discount: 1.0 down to 0.0
    const discountMultiplier = 1 - (positionFactor * maxDiscount);
    
    const collateral = Math.round(baseAmount * ratio * discountMultiplier);
    // --- LOGIC END ---

    return new Response(
      JSON.stringify({ 
        collateral, 
        discount_applied: `${(positionFactor * 100).toFixed(1)}%`,
        is_anchor: position === totalSlots
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})