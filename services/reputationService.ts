import { supabaseAdmin as sb } from '../supabaseClient';
import type { UserReputation } from '../types';

export async function getUserReputation(orgId:number, userId:string): Promise<UserReputation | null>{
  const { data, error } = await sb.from('v_user_reputation').select('*')
    .eq('org_id', orgId).eq('user_id', userId).single();
  if (error) throw error; return data as UserReputation | null;
}
