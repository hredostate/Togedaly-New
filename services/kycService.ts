import { supabase } from '../supabaseClient';
import type { KycProfile, DeviceEvent } from '../types';

/**
 * Gets the KYC profile for a user from Supabase
 */
export async function getKycProfile(userId: string): Promise<KycProfile | null> {
    try {
        const { data, error } = await supabase
            .from('kyc_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found, return null
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error fetching KYC profile:', error);
        return null;
    }
}

/**
 * Checks if a user can top up their wallet based on KYC status
 */
export async function canTopup(amountNaira: number): Promise<{ allowed: boolean; reason: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { allowed: false, reason: 'Not authenticated' };
        }

        const profile = await getKycProfile(user.id);
        
        // Require KYC verification for amounts over ₦10,000
        if (amountNaira > 10000 && (!profile || profile.status !== 'verified')) {
            return { allowed: false, reason: 'KYC verification required for amounts over ₦10,000' };
        }

        return { allowed: true, reason: 'ok' };
    } catch (error) {
        console.error('Error checking topup eligibility:', error);
        return { allowed: false, reason: 'Error checking eligibility' };
    }
}

/**
 * Gets device login history for a user
 */
export async function getDeviceHistory(): Promise<DeviceEvent[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return [];
        }

        const { data, error } = await supabase
            .from('device_events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching device history:', error);
        // Return mock data as fallback
        return [
            { 
                id: 1, 
                device_hash: 'current-device', 
                ip: '127.0.0.1', 
                city: 'Lagos', 
                country: 'NG', 
                created_at: new Date().toISOString() 
            }
        ];
    }
}

/**
 * Submits KYC data for verification
 * In production, this would call SmileID or VerifyMe API
 */
export async function submitKyc(userId: string, data: any) {
    try {
        // Create or update KYC profile in Supabase
        const kycData = {
            user_id: userId,
            status: 'pending' as const,
            provider: 'smileid' as const,
            data: {
                nin: data.nin || null,
                bvn: data.bvn || null,
                kin_name: data.kinName || null,
                kin_phone: data.kinPhone || null,
                kin_relation: data.kinRelation || null,
                selfie_url: data.selfie || null,
            },
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('kyc_profiles')
            .upsert(kycData, { onConflict: 'user_id' });

        if (error) {
            throw error;
        }

        // TODO: In production, call SmileID/VerifyMe API here
        // For now, auto-approve after 2 seconds (demo mode)
        setTimeout(async () => {
            await supabase
                .from('kyc_profiles')
                .update({ status: 'verified', updated_at: new Date().toISOString() })
                .eq('user_id', userId);
        }, 2000);

        return true;
    } catch (error) {
        console.error('Error submitting KYC:', error);
        throw new Error('Failed to submit KYC verification');
    }
}
