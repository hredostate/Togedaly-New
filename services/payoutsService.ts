
import { mockPayoutRuns, mockPayoutInstructions } from '../data/payoutMockData';
import type { PayoutInstruction } from '../types';

let instructionsDb = [...mockPayoutInstructions];
let runsDb = [...mockPayoutRuns];

export async function generateRun(poolId: number, cycleId: number, actor: string): Promise<number> {
    console.log('MOCK: generate_payout_run', { poolId, cycleId, actor });
    await new Promise(res => setTimeout(res, 500));
    
    const existingRun = runsDb.find(r => r.pool_id === String(poolId) && r.cycle_id === String(cycleId));
    if (existingRun) {
        console.log('Run already exists:', existingRun.id);
        return existingRun.id;
    }

    const runId = Date.now();
    runsDb.push({ id: runId, pool_id: String(poolId), cycle_id: String(cycleId), run_at: new Date().toISOString(), created_by: actor });
    
    const newInstruction: PayoutInstruction = {
        id: Date.now() + 1,
        run_id: runId,
        pool_id: String(poolId),
        cycle_id: String(cycleId),
        user_id: 'mock-recipient-id',
        slot_index: 1,
        rotation_position: cycleId % 3,
        amount: 20000,
        status: 'scheduled',
        meta: { generated_by_admin: actor },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    instructionsDb.push(newInstruction);
    
    return runId;
}

export async function markPaid(instrId: number, providerRef: string): Promise<boolean> {
    console.log('MOCK: admin_mark_payout_paid', { instrId, providerRef });
    await new Promise(res => setTimeout(res, 300));
    const instruction = instructionsDb.find(i => i.id === instrId);
    if (instruction) {
        instruction.status = 'paid';
        instruction.provider_ref = providerRef;
        instruction.updated_at = new Date().toISOString();
        return true;
    }
    throw new Error('Instruction not found');
}

export async function markFailed(instrId: number, reason: string): Promise<boolean> {
    console.log('MOCK: admin_mark_payout_failed', { instrId, reason });
    await new Promise(res => setTimeout(res, 300));
    const instruction = instructionsDb.find(i => i.id === instrId);
    if (instruction) {
        instruction.status = 'failed';
        instruction.meta.fail_reason = reason;
        instruction.updated_at = new Date().toISOString();
        return true;
    }
    throw new Error('Instruction not found');
}

export async function deferPayout(instrId: number, reason: string): Promise<boolean> {
    console.log('MOCK: admin_defer_payout', { instrId, reason });
    await new Promise(res => setTimeout(res, 300));
    const instruction = instructionsDb.find(i => i.id === instrId);
    if (instruction) {
        instruction.status = 'deferred';
        instruction.meta.defer_reason = reason;
        instruction.updated_at = new Date().toISOString();
        return true;
    }
    throw new Error('Instruction not found');
}

export async function getPayoutsToday(poolId: number): Promise<PayoutInstruction[]> {
    console.log('MOCK: v_payout_today for pool', poolId);
    await new Promise(res => setTimeout(res, 200));
    // Simulate the view logic - join with runs and cycles for today
    return instructionsDb.filter(i => i.pool_id === String(poolId));
}

/**
 * Edge Function: Securely approves a payout.
 * Enforces admin permissions check via simulated RLS/Policy before update.
 */
export async function approvePayoutSecure(instrId: number, adminId: string): Promise<boolean> {
    console.log('MOCK EDGE FUNCTION: approvePayoutSecure', { instrId, adminId });
    await new Promise(res => setTimeout(res, 600));
    
    // Simulate Server-Side Perms Check
    if (!adminId) throw new Error("Unauthorized");
    
    const instruction = instructionsDb.find(i => i.id === instrId);
    if (!instruction) throw new Error('Instruction not found');
    
    // Transition logic
    if (instruction.status !== 'scheduled') throw new Error("Payout not in scheduled state");
    
    // Update
    instruction.status = 'paid'; // In real flow might go to 'processing' first
    instruction.meta.approved_by = adminId;
    instruction.updated_at = new Date().toISOString();
    
    return true;
}
