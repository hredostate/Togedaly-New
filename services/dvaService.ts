
import { supabase } from '../supabaseClient';
import type { VirtualAccount, IncomingTransfer } from '../types';
import { recordIdempotency } from './idempotencyService';
import { decideRoute } from './routingService';
import { DISABLE_WALLET_CREDIT } from '../config';
import { logAdminAction } from './auditService';

// Fallback Store
let localAccounts: VirtualAccount[] = [];
let localTransfers: IncomingTransfer[] = [];

export async function getProviders(): Promise<{ name: string; slug: string }[]> {
    // In real app, fetch from Paystack API via Backend
    await new Promise(res => setTimeout(res, 300));
    return [
        { name: 'Wema Bank', slug: 'wema-bank' },
        { name: 'Titan Paystack', slug: 'titan-paystack' },
        { name: 'Test Bank', slug: 'test-bank' },
    ];
}

export async function getVirtualAccounts(): Promise<VirtualAccount[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localAccounts;

    try {
        const { data, error } = await supabase.from('virtual_accounts').select('*').eq('user_id', user.id);
        if (error) throw error;
        return data as VirtualAccount[];
    } catch (e) {
        console.warn("DB Fetch DVA failed, using fallback", e);
        return localAccounts.filter(a => a.user_id === user.id);
    }
}

export async function createDva(provider_slug: string): Promise<{ number: string; bank: string; name: string; }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in");

    // Simulate Provider Call
    await new Promise(res => setTimeout(res, 1000));
    
    const providerMap: Record<string, string> = {
        'wema-bank': 'Wema Bank',
        'titan-paystack': 'Titan Trust Bank',
        'test-bank': 'Test Bank',
    };
    
    const newAccountDetails = {
        number: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        bank: providerMap[provider_slug] || 'Unknown Bank',
        name: `TOGEDALY/${user.email?.split('@')[0].toUpperCase()}`,
    };
    
    const newVa = {
        user_id: user.id,
        provider_slug,
        account_number: newAccountDetails.number,
        bank_name: newAccountDetails.bank,
        account_name: newAccountDetails.name,
        active: true,
        assigned: true,
    };

    try {
        const { error } = await supabase.from('virtual_accounts').insert(newVa);
        if (error) throw error;
    } catch (e) {
        console.warn("DB Create DVA failed, using mock", e);
        localAccounts.push({ ...newVa, id: `va-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    
    return newAccountDetails;
}

export async function getIncomingTransfers(): Promise<IncomingTransfer[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localTransfers;

    try {
        const { data, error } = await supabase.from('incoming_transfers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return data as IncomingTransfer[];
    } catch (e) {
        return localTransfers;
    }
}

// --- WEBHOOK SIMULATION (Client-Side Logic for Demo) ---
export async function simulateChargeSuccessWebhook(payload: any) {
    const tx = payload.data;
    const amount_kobo = tx.amount;
    const narration = tx.authorization.narration || '';
    
    // 1. Idempotency
    const isNew = await recordIdempotency('paystack', 'charge.success', String(tx.id));
    if (!isNew) return { ok: true, skipped: 'duplicate', message: 'Duplicate event' };

    // 2. Kill Switch
    if (DISABLE_WALLET_CREDIT) {
        await logAdminAction('system', 'wallet.credit.skipped', `user:unknown`, { reason: 'kill_switch' });
        return { ok: true, notice: 'credit_disabled' };
    }

    // 3. Find User (Mock lookup based on account number in local store or current user)
    // In a real webhook, we query DB by account_number.
    // Here we assume it's for the current user for the demo.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: 'No user session for simulation' };

    // 4. Decide Route
    const route = await decideRoute(user.id, narration);

    // 5. Persist Transfer Record
    const transferRecord = {
        user_id: user.id,
        amount_kobo,
        currency: 'NGN',
        provider_slug: 'wema-bank', // inferred
        sender_bank: tx.authorization.sender_bank,
        sender_account_number: tx.authorization.sender_account_number,
        receiver_account_number: tx.authorization.receiver_bank_account_number,
        narration,
        paystack_tx_id: tx.id,
        raw: tx,
    };

    try {
        await supabase.from('incoming_transfers').insert(transferRecord);
        // Also simulate crediting wallet/pool via RPC if we were real
        // await supabase.rpc('credit_wallet', { ... }) 
    } catch (e) {
        localTransfers.unshift({ ...transferRecord, id: `it-${Date.now()}`, created_at: new Date().toISOString() } as any);
    }

    return { ok: true, credited: true, route, message: `Simulated credit of ₦${(amount_kobo/100).toLocaleString()} to ${route.dest}` };
}
