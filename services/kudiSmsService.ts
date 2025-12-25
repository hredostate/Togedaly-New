/**
 * KudiSMS Service
 * 
 * Handles OTP sending and verification using the KudiSMS V2 API
 * API Documentation: https://my.kudisms.net/api/personalisedsms
 */

import { supabase } from '../supabaseClient';

const KUDISMS_API_URL = 'https://my.kudisms.net/api/personalisedsms';
const OTP_EXPIRY_MINUTES = 10;

interface KudiSMSResponse {
  code: string;
  message: string;
}

interface SMSConfig {
  api_token: string;
  sender_id: string;
}

/**
 * KudiSMS Error Codes
 */
export const KUDISMS_ERROR_CODES: Record<string, string> = {
  '000': 'Message Sent Successfully',
  '100': 'Token provided is invalid',
  '107': 'Invalid phone number',
  '109': 'Insufficient credit balance',
  '188': 'Sender ID unapproved',
  '300': 'Missing parameters',
};

/**
 * Normalize Nigerian phone number to 234XXXXXXXXXX format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (normalized.startsWith('0')) {
    // 0803XXXXXXX -> 234803XXXXXXX
    normalized = '234' + normalized.substring(1);
  } else if (normalized.startsWith('234')) {
    // Already in correct format
  } else if (normalized.startsWith('+234')) {
    // +234803XXXXXXX -> 234803XXXXXXX
    normalized = normalized.substring(1);
  } else if (normalized.length === 10) {
    // 803XXXXXXX -> 234803XXXXXXX
    normalized = '234' + normalized;
  }
  
  return normalized;
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Nigerian phone numbers: 234 + 7-9 digit + 9 more digits = 13 digits total
  return /^234[7-9]\d{9}$/.test(normalized);
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get SMS configuration from database
 * Note: This should be called from API routes with proper permissions
 */
async function getSMSConfig(): Promise<SMSConfig | null> {
  // This function should only be called from server-side API routes
  // that have proper admin access. For now, we'll use the regular client
  // but in production, API routes should use service role client.
  const { data, error } = await supabase
    .from('sms_config')
    .select('api_token, sender_id')
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) {
    console.error('Failed to get SMS config:', error);
    return null;
  }
  
  return data;
}

/**
 * Store OTP in database
 * Note: This should be called from API routes with service role permissions
 */
async function storeOTP(phone: string, code: string): Promise<boolean> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
  
  // This should be called from API routes that use service role client
  const { error } = await supabase
    .from('otp_codes')
    .insert({
      phone,
      code,
      expires_at: expiresAt.toISOString(),
      verified: false
    });
  
  if (error) {
    console.error('Failed to store OTP:', error);
    return false;
  }
  
  return true;
}

/**
 * Send SMS via KudiSMS API
 */
export async function sendSMS(
  phone: string,
  message: string,
  config: SMSConfig
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    
    const payload = {
      token: config.api_token,
      senderID: config.sender_id,
      message: message,
      csvHeaders: ['phone_number'],
      recipients: [{ phone_number: normalizedPhone }]
    };
    
    const response = await fetch(KUDISMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const result: KudiSMSResponse = await response.json();
    
    if (result.code === '000') {
      return { success: true };
    } else {
      const errorMessage = KUDISMS_ERROR_CODES[result.code] || result.message || 'Unknown error';
      return { success: false, error: errorMessage, code: result.code };
    }
  } catch (error: any) {
    console.error('KudiSMS API error:', error);
    return { success: false, error: 'Failed to send SMS. Please try again.' };
  }
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<{ 
  success: boolean; 
  error?: string;
  code?: string;
}> {
  // Validate phone number
  if (!isValidNigerianPhone(phone)) {
    return { success: false, error: 'Invalid Nigerian phone number format' };
  }
  
  const normalizedPhone = normalizePhoneNumber(phone);
  
  // Get SMS config
  const config = await getSMSConfig();
  if (!config) {
    return { success: false, error: 'SMS service not configured. Please contact support.' };
  }
  
  // Generate OTP
  const otp = generateOTP();
  
  // Store OTP in database
  const stored = await storeOTP(normalizedPhone, otp);
  if (!stored) {
    return { success: false, error: 'Failed to generate verification code. Please try again.' };
  }
  
  // Send SMS
  const message = `Your Togedaly verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
  const result = await sendSMS(normalizedPhone, message, config);
  
  return result;
}

/**
 * Verify OTP code
 * Note: This should be called from API routes with service role permissions
 */
export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedPhone = normalizePhoneNumber(phone);
  
  // This should be called from API routes that use service role client
  // Get the most recent unverified OTP for this phone
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', normalizedPhone)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error || !data) {
    return { success: false, error: 'No verification code found. Please request a new code.' };
  }
  
  // Check if OTP has expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }
  
  // Verify code
  if (data.code !== code) {
    return { success: false, error: 'Invalid verification code. Please try again.' };
  }
  
  // Mark OTP as verified
  await supabase
    .from('otp_codes')
    .update({ verified: true })
    .eq('id', data.id);
  
  return { success: true };
}

/**
 * Clean up expired OTPs (can be called periodically)
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  await supabase
    .from('otp_codes')
    .delete()
    .lt('expires_at', new Date().toISOString());
}
