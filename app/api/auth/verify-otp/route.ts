import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, normalizePhoneNumber } from '../../../../services/kudiSmsService';
import { supabase } from '../../../../supabaseClient';

/**
 * POST /api/auth/verify-otp
 * Verify OTP and sign in/sign up user
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, code, fullName, isSignUp } = await req.json();
    
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }
    
    // Verify OTP
    const result = await verifyOTP(phone, code);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('phone', normalizedPhone)
      .single();
    
    if (isSignUp && existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered. Please sign in instead.' },
        { status: 400 }
      );
    }
    
    if (!isSignUp && !existingUser) {
      return NextResponse.json(
        { error: 'Phone number not found. Please sign up first.' },
        { status: 404 }
      );
    }
    
    // For sign up: Create user with phone auth
    // For sign in: Just verify the user exists (actual auth handled by Supabase)
    if (isSignUp) {
      // Note: In production, you would create the user via Supabase Admin API
      // For now, we return success and let the frontend handle the session
      return NextResponse.json({
        success: true,
        message: 'Verification successful',
        isNewUser: true,
        phone: normalizedPhone,
        fullName: fullName || ''
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Verification successful',
        isNewUser: false,
        phone: normalizedPhone,
        userId: existingUser?.user_id
      });
    }
    
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
