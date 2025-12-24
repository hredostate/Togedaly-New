import { supabase } from '../supabaseClient';
import type { RevenueEvent, MilestoneProof } from '../types';

/**
 * Fetches the revenue distribution history for a specific pool.
 * ---
 * MOCK IMPLEMENTATION: Returns static mock data for a specific pool ID.
 */
export async function getRevenueHistory(poolId: string): Promise<RevenueEvent[]> {
    console.log(`MOCK: getRevenueHistory for ${poolId}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    if (poolId === 'a1b2c3d4-e5f6-7890-1234-567890abcdef') {
        return [
            { id: 'rev-1', pool_id: poolId, total_revenue_kobo: 2500000, cycle_end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Week 1 returns from transport' },
            { id: 'rev-2', pool_id: poolId, total_revenue_kobo: 3100000, cycle_end: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Week 2 returns, higher demand' },
        ];
    }
    return [];
}

/**
 * Fetches all proofs submitted for a specific milestone.
 * ---
 * MOCK IMPLEMENTATION: Returns a mock proof for the 'approved' cow share milestone.
 */
export async function getMilestoneProofs(milestoneId: number): Promise<MilestoneProof[]> {
    console.log(`MOCK: getMilestoneProofs for ${milestoneId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    if (milestoneId === 201) { // Cow Share milestone from mockData
        return [{
            id: 1,
            milestone_id: 201,
            uploader: 'mock-owner-id',
            proof_url: 'https://example.com/proof/healthy-cow.jpg',
            approved: true,
            uploaded_at: new Date().toISOString()
        }];
    }
    return [];
}

/**
 * Uploads a proof of work for a given milestone.
 * ---
 * MOCK IMPLEMENTATION: Simulates uploading a new proof.
 */
export async function uploadMilestoneProof(milestoneId: number, proofUrl: string): Promise<MilestoneProof> {
    console.log(`MOCK: uploadMilestoneProof for ${milestoneId} with url ${proofUrl}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProof: MilestoneProof = {
        id: Math.floor(Math.random() * 1000),
        milestone_id: milestoneId,
        uploader: 'mock-user-id',
        proof_url: proofUrl,
        approved: true, // Mocking auto-approval for demo purposes
        uploaded_at: new Date().toISOString()
    };
    return newProof;
}

/**
 * Calls the RPC function to release funds for an approved milestone.
 * ---
 * MOCK IMPLEMENTATION: Simulates a successful fund release.
 */
export async function releaseMilestoneFunds(milestoneId: number): Promise<void> {
    console.log(`MOCK: releaseMilestoneFunds for ${milestoneId}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    // No return value needed
    return Promise.resolve();
}