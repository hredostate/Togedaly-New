

import type { KycProfile, UserRiskProfile } from '../types';

export const mockKycProfiles: KycProfile[] = [
    {
        user_id: 'user-001',
        status: 'verified',
        provider: 'manual',
        data: { nin: '1234567890123', bvn: '12345678901' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        user_id: 'user-002',
        status: 'pending',
        provider: 'smileid',
        last_ref: 'SMILE-12345',
        data: { nin: '2345678901234' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        user_id: 'user-003',
        status: 'unverified',
        data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
     {
        user_id: 'user-007',
        status: 'rejected',
        provider: 'verifyme',
        data: { reason: 'Document unclear' },
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
];

export const mockUserRiskProfiles: UserRiskProfile[] = [
    { 
        user_id: 'user-001', 
        status: 'verified', 
        provider: 'manual',
        data: { nin: '1234567890123', bvn: '12345678901' },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        risk_30d: 15, 
        risk_all: 50, 
        last_event_at: new Date(Date.now() - 5 * 86400000).toISOString(), 
        account_number: '0111111111', 
        bvn: '12345678901', 
        bank_code: '058', 
        first_name: 'Adanna', 
        last_name: 'The GOAT' 
    },
    { 
        user_id: 'user-002', 
        status: 'pending', 
        provider: 'smileid',
        last_ref: 'SMILE-12345',
        data: { nin: '2345678901234' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        risk_30d: 30, 
        risk_all: 30, 
        last_event_at: new Date(Date.now() - 2 * 86400000).toISOString() 
    },
    { 
        user_id: 'user-003', 
        status: 'unverified',
        data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        risk_30d: 5, 
        risk_all: 5 
    },
    { 
        user_id: 'user-007', 
        status: 'rejected',
        provider: 'verifyme',
        data: { reason: 'Document unclear' },
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        risk_30d: 85, 
        risk_all: 120, 
        last_event_at: new Date(Date.now() - 1 * 86400000).toISOString(), 
        account_number: '0987654321', 
        bvn: '98765432109', 
        bank_code: '011', 
        first_name: 'Ngozi', 
        last_name: 'Default' 
    },
];