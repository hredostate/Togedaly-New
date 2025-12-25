// ⚠️ ⚠️ ⚠️ CRITICAL WARNING: MOCK IMPLEMENTATIONS ONLY ⚠️ ⚠️ ⚠️
//
// These are MOCK/STUB implementations for development and testing purposes ONLY.
// DO NOT USE IN PRODUCTION - these functions do not perform real KYC verification!
//
// SECURITY RISKS:
// - No actual identity verification
// - Signature verification always returns true (security bypass)
// - No fraud prevention or compliance checks
// - Does not meet regulatory requirements
//
// TODO: Before production launch, replace with real integrations:
// 1. SmileID: Implement actual API calls to https://docs.usesmileid.com/
//    - Proper authentication with API key and partner ID
//    - Real document verification
//    - Biometric matching
//    - HMAC signature verification using crypto module
//
// 2. VerifyMe (NG): Implement actual API calls to https://verifyme.ng/
//    - Proper API authentication
//    - NIN/BVN verification
//    - Liveness checks
//    - Webhook signature verification
//
// 3. Implement proper webhook signature verification using:
//    - crypto.createHmac() with your secret keys
//    - Constant-time comparison to prevent timing attacks
//
// 4. Move all KYC operations to secure server-side API routes
//    - Store secrets in server-only environment variables
//    - Add rate limiting
//    - Implement audit logging
//
// In a real app, these functions would make API calls to the respective KYC providers.
// They would be executed in a secure server-side environment (e.g., a Next.js API route).

export async function createSmileIdJob(userId: string, payload: any){
  // MOCK: Creating SmileID job for development only
  await new Promise(res => setTimeout(res, 800));
  // POST to SmileID v2/v3, return reference
  return `SMILE-${Date.now()}`;
}
export function verifySmileIdSig(raw: string, sig: string){
    // MOCK: Verifying SmileID signature - always returning true for demo
    // In a real app, you'd use crypto to perform an HMAC verification against your secret.
    return true;
}

export async function createVerifyMeJob(userId: string, payload: any){
  // MOCK: Creating VerifyMe job for development only
  await new Promise(res => setTimeout(res, 800));
  // POST to VerifyMe NG, return reference
  return `VM-${Date.now()}`;
}
export function verifyVerifyMeSig(raw: string, sig: string){
    // MOCK: Verifying VerifyMe signature - always returning true for demo
    // In a real app, you'd use crypto to perform an HMAC verification.
    return true;
}
