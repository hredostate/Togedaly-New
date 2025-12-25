import type { RefinanceRequest } from '../types';

let refinanceDB: RefinanceRequest[] = [];

/**
 * Fetches the user's total available collateral across all their pools.
 */
export async function getAggregatedCollateral(): Promise<{ total_available_kobo: number }> {
    console.log("getAggregatedCollateral");
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: In a real app, this would be a SUM query on the user's collateral accounts.
    return { total_available_kobo: 0 };
}

/**
 * Fetches the user's refinance history.
 */
export async function getRefinanceHistory(): Promise<RefinanceRequest[]> {
    console.log("getRefinanceHistory");
    await new Promise(resolve => setTimeout(resolve, 400));
    return [...refinanceDB].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Creates a new refinance loan request.
 */
export async function requestRefinanceLoan(amount_kobo: number, repayment_due_at: string): Promise<RefinanceRequest> {
    console.log("requestRefinanceLoan", { amount_kobo, repayment_due_at });
    await new Promise(resolve => setTimeout(resolve, 800));

    const { total_available_kobo } = await getAggregatedCollateral();
    if (amount_kobo > total_available_kobo) {
        throw new Error("Requested loan amount exceeds available collateral.");
    }

    const newRequest: RefinanceRequest = {
        id: `ref-${Date.now()}`,
        user_id: 'mock-user-id',
        amount_kobo,
        collateral_locked_kobo: amount_kobo,
        interest_rate_bps: 500, // 5%
        repayment_due_at,
        status: 'pending', // Starts as pending admin approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    refinanceDB.unshift(newRequest);
    return newRequest;
}