// services/bankService.ts

/**
 * Fetches a list of Nigerian banks.
 * ---
 * MOCK IMPLEMENTATION: Simulates the /api/banks endpoint by returning a static
 * fallback list. In a real application with a backend, an API-only mode could be
 * implemented to disable this fallback if the Paystack API is unreachable.
 */
export async function getBanks(): Promise<{ name: string; code: string }[]> {
    console.log("MOCK: getBanks using static fallback list.");

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

    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return fallback;
}