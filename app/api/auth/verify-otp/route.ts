import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, normalizePhoneNumber } from '../../../../services/kudiSmsService';
import { supabase } from '../../../../supabaseClient';

/**
 * POST /api/auth/verify-otp
 * Verify OTP and check user status
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
    
    // Check if user exists with this phone
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle();
    
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
    
    // Return success with user info
    // Note: In a complete implementation, you would:
    // 1. Use Supabase Admin API to create/fetch the user
    // 2. Generate a session token
    // 3. Return the session token to the client
    // For now, we just verify the OTP and let the client know verification succeeded
    
    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      isNewUser: isSignUp,
      phone: normalizedPhone,
      // In production, include session token here
      note: 'Phone verification successful. In production, this would include a session token for automatic sign-in.'
    });
    
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
