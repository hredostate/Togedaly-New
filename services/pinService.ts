
/**
 * Verifies the user's transaction PIN.
 * ---
 * MOCK IMPLEMENTATION: Checks against a hardcoded PIN '1234'.
 * In production, this would call a secure backend endpoint (e.g. /api/auth/verify-pin).
 */
export async function verifyTransactionPin(pin: string): Promise<boolean> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Hardcoded check for demo purposes
    return pin === '1234';
}
