import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../supabaseClient';
import { sendSMS } from '../../../../services/kudiSmsService';

/**
 * Verify admin access from JWT token
 */
async function verifyAdminAccess(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return false;
    }
    
    // Check if user email ends with @togedaly.com
    return user.email?.endsWith('@togedaly.com') ?? false;
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/sms-config
 * Get SMS configuration (token masked)
 */
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAccess(req);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { data, error } = await supabase
      .from('sms_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (!data) {
      return NextResponse.json({
        configured: false,
        provider: 'kudisms',
        sender_id: '',
        api_token: ''
      });
    }
    
    // Mask token for security (ensure token has minimum length)
    const maskedToken = data.api_token && data.api_token.length >= 12
      ? data.api_token.substring(0, 8) + '...' + data.api_token.substring(data.api_token.length - 4)
      : '***masked***';
    
    return NextResponse.json({
      configured: true,
      provider: data.provider,
      sender_id: data.sender_id,
      api_token: maskedToken,
      created_at: data.created_at,
      updated_at: data.updated_at
    });
    
  } catch (error: any) {
    console.error('Get SMS config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sms-config
 * Save/update SMS configuration
 */
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminAccess(req);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const { api_token, sender_id, test_phone } = await req.json();
    
    if (!api_token || !sender_id) {
      return NextResponse.json(
        { error: 'API token and sender ID are required' },
        { status: 400 }
      );
    }
    
    // Test SMS if phone provided
    if (test_phone) {
      const testResult = await sendSMS(
        test_phone,
        'Test message from Togedaly SMS Config',
        { api_token, sender_id }
      );
      
      if (!testResult.success) {
        return NextResponse.json(
          { 
            error: `SMS test failed: ${testResult.error}`,
            code: testResult.code
          },
          { status: 400 }
        );
      }
    }
    
    // Check if config exists
    const { data: existing } = await supabase
      .from('sms_config')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();
    
    if (existing) {
      // Update existing config
      const { error } = await supabase
        .from('sms_config')
        .update({
          api_token,
          sender_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Insert new config
      const { error } = await supabase
        .from('sms_config')
        .insert({
          api_token,
          sender_id,
          provider: 'kudisms',
          is_active: true
        });
      
      if (error) throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: test_phone 
        ? 'SMS configuration saved and test message sent successfully'
        : 'SMS configuration saved successfully'
    });
    
  } catch (error: any) {
    console.error('Save SMS config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
