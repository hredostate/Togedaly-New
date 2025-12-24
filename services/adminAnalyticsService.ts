
import { mockOrgHealth, mockOrgArrears, mockUnlockEligibility } from '../data/adminAnalyticsMockData';

export async function getOrgHealth(orgId: string) {
    await new Promise(res => setTimeout(res, 300));
    return mockOrgHealth;
}

export async function getOrgArrears(orgId: string) {
    await new Promise(res => setTimeout(res, 400));
    return mockOrgArrears;
}

export async function getUnlockEligibility(orgId: string) {
    await new Promise(res => setTimeout(res, 300));
    return mockUnlockEligibility;
}
