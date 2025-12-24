// In a real app, these functions would make API calls to the respective KYC providers.
// They would be executed in a secure server-side environment (e.g., a Next.js API route).

export async function createSmileIdJob(userId: string, payload: any){
  console.log('MOCK: Creating SmileID job for user', userId, 'with payload', payload);
  await new Promise(res => setTimeout(res, 800));
  // POST to SmileID v2/v3, return reference
  return `SMILE-${Date.now()}`;
}
export function verifySmileIdSig(raw: string, sig: string){
    console.log('MOCK: Verifying SmileID signature. Always returning true for demo.');
    // In a real app, you'd use crypto to perform an HMAC verification against your secret.
    return true;
}

export async function createVerifyMeJob(userId: string, payload: any){
  console.log('MOCK: Creating VerifyMe job for user', userId, 'with payload', payload);
  await new Promise(res => setTimeout(res, 800));
  // POST to VerifyMe NG, return reference
  return `VM-${Date.now()}`;
}
export function verifyVerifyMeSig(raw: string, sig: string){
    console.log('MOCK: Verifying VerifyMe signature. Always returning true for demo.');
    // In a real app, you'd use crypto to perform an HMAC verification.
    return true;
}
