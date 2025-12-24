
export const mockTrustHistory = [
    { date: '2024-01-01', score: 50, reason: 'Account Created' },
    { date: '2024-02-01', score: 55, reason: 'KYC Verified' },
    { date: '2024-03-01', score: 65, reason: 'First Ajo Contribution' },
    { date: '2024-04-01', score: 70, reason: 'On-time Payment' },
    { date: '2024-05-01', score: 68, reason: 'Late Payment (-2)' },
    { date: '2024-06-01', score: 75, reason: 'Loan Repaid' },
];

export const mockTrustFactors = [
    { factor: 'Identity Verification', impact: 15, max: 20 },
    { factor: 'Payment History', impact: 40, max: 50 },
    { factor: 'Community Endorsements', impact: 10, max: 20 },
    { factor: 'Platform Tenure', impact: 10, max: 10 },
];
