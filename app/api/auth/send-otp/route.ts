import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, isValidNigerianPhone } from '../../../../services/kudiSmsService';

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // Validate phone number format
    if (!isValidNigerianPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid Nigerian phone number format. Please use format: 0803XXXXXXX or +234803XXXXXXX' },
        { status: 400 }
      );
    }
    
    // Send OTP
    const result = await sendOTP(phone);
    
    if (!result.success) {
      // Handle specific error codes
      if (result.code === '109') {
        return NextResponse.json(
          { error: 'SMS service temporarily unavailable. Please try email login or contact support.' },
          { status: 503 }
        );
      } else if (result.code === '100') {
        return NextResponse.json(
          { error: 'SMS service configuration error. Please contact support.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    });
    
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
