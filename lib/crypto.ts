/**
 * Cryptographic utilities for secure hashing and data protection
 */

/**
 * Hash a PIN using SHA-256
 * In production, use bcrypt or argon2 with salt on the backend
 */
export async function hashPin(pin: string): Promise<string> {
    // Use Web Crypto API for client-side hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Generate a random salt for password hashing
 */
export function generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password with salt (for future use)
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const actualSalt = salt || generateSalt();
    const encoder = new TextEncoder();
    const data = encoder.encode(password + actualSalt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash, salt: actualSalt };
}
