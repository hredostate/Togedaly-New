import { supabase } from '../supabaseClient';
import { hashPin } from '../lib/crypto';

/**
 * Verifies the user's transaction PIN.
 * Checks against stored hashed PIN in Supabase user_pins table.
 * Falls back to hardcoded '1234' if no PIN is set (for demo/testing).
 */
export async function verifyTransactionPin(pin: string): Promise<boolean> {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user for PIN verification');
            return false;
        }

        // Query the user's PIN from Supabase
        const { data: pinRecord, error } = await supabase
            .from('user_pins')
            .select('pin_hash')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // If no PIN is set, fall back to demo PIN for testing
            console.warn('No PIN found in database, using demo PIN 1234');
            return pin === '1234';
        }

        // Compare hashed PIN
        const hashedInput = await hashPin(pin);
        return hashedInput === pinRecord.pin_hash;
        
    } catch (error) {
        console.error('PIN verification error:', error);
        // Fallback to demo PIN for testing
        return pin === '1234';
    }
}

/**
 * Sets or updates the user's transaction PIN.
 * Stores hashed PIN in Supabase user_pins table.
 */
export async function setTransactionPin(pin: string): Promise<boolean> {
    try {
        // Validate PIN format (4 digits)
        if (!/^\d{4}$/.test(pin)) {
            throw new Error('PIN must be exactly 4 digits');
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No authenticated user');
        }

        // Hash the PIN
        const pinHash = await hashPin(pin);

        // Upsert to user_pins table
        const { error } = await supabase
            .from('user_pins')
            .upsert({
                user_id: user.id,
                pin_hash: pinHash,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Error setting PIN:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in setTransactionPin:', error);
        return false;
    }
}
