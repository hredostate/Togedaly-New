// services/bankService.ts

/**
 * Fetches the list of Nigerian banks from Paystack API
 * Falls back to static list if API call fails or no API key is provided
 */
export async function getBanks(): Promise<{ name: string; code: string }[]> {
    const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY || '';
    const BASE_URL = 'https://api.paystack.co';
    
    // Try to fetch from Paystack API if key is available
    if (PAYSTACK_SECRET_KEY) {
        try {
            const response = await fetch(`${BASE_URL}/bank?country=nigeria`, {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                }
            });

            const data = await response.json();
            
            if (response.ok && data.status && data.data) {
                console.log('[BANK SERVICE] Successfully fetched banks from Paystack API');
                return data.data.map((bank: any) => ({
                    name: bank.name,
                    code: bank.code
                }));
            }
        } catch (error) {
            console.warn('[BANK SERVICE] Failed to fetch from Paystack API, using fallback:', error);
        }
    } else {
        console.warn('[BANK SERVICE] No Paystack API key provided, using static fallback list');
    }

    // Fallback to static list of major Nigerian banks
    console.log('[BANK SERVICE] Using static fallback bank list');
    const fallback = [
        { name: 'Access Bank', code: '007' },
        { name: 'Access Bank (Diamond)', code: '063' },
        { name: 'GTBank', code: '058' },
        { name: 'First Bank of Nigeria', code: '011' },
        { name: 'UBA', code: '033' },
        { name: 'Zenith Bank', code: '057' },
        { name: 'Fidelity Bank', code: '070' },
        { name: 'FCMB', code: '214' },
        { name: 'Stanbic IBTC', code: '221' },
        { name: 'Polaris Bank', code: '076' },
        { name: 'Sterling Bank', code: '232' },
        { name: 'Union Bank', code: '032' },
        { name: 'Wema Bank', code: '035' },
        { name: 'Keystone Bank', code: '082' },
        { name: 'Standard Chartered', code: '068' },
    ];

    await new Promise(resolve => setTimeout(resolve, 200));
    return fallback;
}