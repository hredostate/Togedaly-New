import { supabase } from '../supabaseClient';
import { hashPin } from '../lib/crypto';

/**
 * Verifies the user's transaction PIN.
 * ---
 * SECURITY WARNING: This is a MOCK IMPLEMENTATION for development only.
 * 
 * TODO: Implement proper backend PIN verification with:
 * - Secure hashing (bcrypt/argon2)
 * - Rate limiting
 * - Account lockout after failed attempts
 * - Audit logging
 * - Server-side validation via Next.js API route
 * 
 * For production, this MUST call a secure backend endpoint (e.g. /api/auth/verify-pin)
 * that performs proper cryptographic comparison of hashed PINs.
 */
export async function verifyTransactionPin(pin: string): Promise<boolean> {
    // SECURITY: Throwing error to prevent accidental production use
    // TODO: Replace with actual backend API call
    throw new Error('PIN verification not implemented. This is a security placeholder. Implement proper backend verification before production use.');
}
