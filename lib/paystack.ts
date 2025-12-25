import { PaystackAuthorization, PaystackSplit } from '../types';

// Use environment variable for Paystack secret key
// In production, this should NEVER be exposed on the client side
// These API calls should be made from a secure backend/API route
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY || '';
const BASE_URL = 'https://api.paystack.co';

// Flag to check if we're in mock mode (no API key provided)
const MOCK_MODE = !PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === '';

/**
 * Initialize a Paystack transaction
 * WARNING: In production, this should be called from a backend API route
 * to keep the secret key secure
 */
export async function initializeTransaction(
    email: string,
    amountKobo: number,
    callbackUrl: string,
    metadata?: any,
    splitCode?: string
): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    console.log(`[PAYSTACK LIB] Initializing Transaction: ${email} for ₦${amountKobo / 100}`);
    
    if (MOCK_MODE) {
        console.warn('[PAYSTACK] Running in MOCK mode - no API key provided');
        await new Promise(res => setTimeout(res, 500));
        const reference = `ref_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return {
            authorization_url: `https://checkout.paystack.com/${reference}`,
            access_code: `ac_${reference}`,
            reference
        };
    }

    try {
        const response = await fetch(`${BASE_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amountKobo,
                callback_url: callbackUrl,
                metadata,
                split_code: splitCode
            }),
        });

        const data = await response.json();
        
        if (!response.ok || !data.status) {
            throw new Error(data.message || 'Failed to initialize transaction');
        }

        return data.data;
    } catch (error) {
        console.error('[PAYSTACK] Error initializing transaction:', error);
        throw error;
    }
}

/**
 * Verify a Paystack transaction
 * WARNING: In production, this should be called from a backend API route
 */
export async function verifyTransaction(reference: string): Promise<{ status: string; amount: number; authorization: PaystackAuthorization }> {
    console.log(`[PAYSTACK LIB] Verifying Transaction: ${reference}`);
    
    if (MOCK_MODE) {
        console.warn('[PAYSTACK] Running in MOCK mode - returning mock verification');
        await new Promise(res => setTimeout(res, 400));
        return {
            status: 'success',
            amount: 500000,
            authorization: {
                authorization_code: `AUTH_${reference}`,
                card_type: 'visa',
                last4: '4081',
                exp_month: '12',
                exp_year: '2030',
                bin: '408408',
                bank: 'TEST BANK',
                channel: 'card',
                signature: `sig_${reference}`,
                reusable: true,
                country_code: 'NG'
            }
        };
    }

    try {
        const response = await fetch(`${BASE_URL}/transaction/verify/${reference}`, {
            headers: { 
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` 
            }
        });

        const data = await response.json();
        
        if (!response.ok || !data.status) {
            throw new Error(data.message || 'Failed to verify transaction');
        }

        return data.data;
    } catch (error) {
        console.error('[PAYSTACK] Error verifying transaction:', error);
        throw error;
    }
}

/**
 * Create a payment split for group transactions
 * WARNING: In production, this should be called from a backend API route
 */
export async function createSplit(
    name: string,
    subaccounts: { subaccount: string; share: number }[]
): Promise<{ id: number; name: string; split_code: string }> {
    console.log(`[PAYSTACK LIB] Creating Split: ${name}`, subaccounts);
    
    if (MOCK_MODE) {
        console.warn('[PAYSTACK] Running in MOCK mode - returning mock split');
        await new Promise(res => setTimeout(res, 600));
        return {
            id: Date.now(),
            name,
            split_code: `SPL_${Math.random().toString(36).substring(7).toUpperCase()}`
        };
    }

    try {
        const response = await fetch(`${BASE_URL}/split`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                type: 'percentage',
                currency: 'NGN',
                subaccounts,
                bearer_type: 'account'
            }),
        });

        const data = await response.json();
        
        if (!response.ok || !data.status) {
            throw new Error(data.message || 'Failed to create split');
        }

        return data.data;
    } catch (error) {
        console.error('[PAYSTACK] Error creating split:', error);
        throw error;
    }
}

/**
 * Charge a saved authorization (recurring payment)
 * WARNING: In production, this should be called from a backend API route
 */
export async function chargeAuthorization(
    amountKobo: number,
    email: string,
    authorization_code: string
): Promise<{ status: string; reference: string }> {
    console.log(`[PAYSTACK LIB] Charging Recurring: ${email} for ₦${amountKobo / 100}`);
    
    if (MOCK_MODE) {
        console.warn('[PAYSTACK] Running in MOCK mode - returning mock charge');
        await new Promise(res => setTimeout(res, 800));
        return {
            status: 'success',
            reference: `rec_mock_${Date.now()}`
        };
    }

    try {
        const response = await fetch(`${BASE_URL}/transaction/charge_authorization`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amountKobo,
                email,
                authorization_code
            }),
        });

        const data = await response.json();
        
        if (!response.ok || !data.status) {
            throw new Error(data.message || 'Failed to charge authorization');
        }

        return data.data;
    } catch (error) {
        console.error('[PAYSTACK] Error charging authorization:', error);
        throw error;
    }
}
