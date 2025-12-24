
import useSWR from 'swr';
import { getKycProfile } from '../services/kycService';
import type { KycProfile } from '../types';

export function useKyc(userId?: string){
  const { data, error, isLoading } = useSWR(
    userId ? `kyc-${userId}` : null,
    () => getKycProfile(userId!)
  );

  return { 
    status: data?.status ?? 'unverified', 
    profile: data ?? null, 
    loading: isLoading 
  };
}
