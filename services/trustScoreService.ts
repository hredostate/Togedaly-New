
import { mockTrustHistory, mockTrustFactors } from '../data/trustScoreMockData';

// TODO: Connect to real Supabase data
// This service should query actual trust score data from the database.
// Required tables:
// - user_trust_scores: Main table for storing trust scores (user_id, score, last_updated)
// - trust_score_factors: Breakdown of factors contributing to score (user_id, factor_type, value, description)
// - trust_score_history: Historical trust score changes (user_id, score, timestamp)
//
// Example queries needed:
// - SELECT * FROM user_trust_scores WHERE user_id = $1
// - SELECT * FROM trust_score_factors WHERE user_id = $1 ORDER BY value DESC
// - SELECT * FROM trust_score_history WHERE user_id = $1 ORDER BY timestamp DESC

export async function getTrustScoreHistory(userId: string) {
    await new Promise(res => setTimeout(res, 400));
    // TODO: Replace with: return supabase.from('trust_score_history').select('*').eq('user_id', userId).order('timestamp', { ascending: false })
    return mockTrustHistory;
}

export async function getTrustScoreBreakdown(userId: string) {
    await new Promise(res => setTimeout(res, 400));
    // TODO: Replace with actual queries to trust_score_factors table
    // Should return { score: number, factors: Array<{ label: string, value: string, positive: boolean }> }
    return {
        score: 75,
        factors: mockTrustFactors
    };
}
