
import { mockTrustHistory, mockTrustFactors } from '../data/trustScoreMockData';

export async function getTrustScoreHistory(userId: string) {
    await new Promise(res => setTimeout(res, 400));
    return mockTrustHistory;
}

export async function getTrustScoreBreakdown(userId: string) {
    await new Promise(res => setTimeout(res, 400));
    return {
        score: 75,
        factors: mockTrustFactors
    };
}
