
import type { Payout, Wallet, Webhook, PayoutEvent, LedgerEntry, Notification, NotificationChannel } from '../types';
import { queueNotifications, dispatchNotifications } from './notificationService';
import { logAdminAction } from './auditService';

// Mock database
let mockWallets: Wallet[] = Array.from({ length: 8 }, (_, i) => ({
    id: `w-mock-${i}`,
    owner_type: 'user',
    owner_id: `u-mock-${i}`,
    balance_kobo: Math.floor(Math.random() * 50000000),
}));

// FIX: Corrected mock Payout objects to be compliant with the Payout type.
let mockPayouts: Payout[] = Array.from({ length: 20 }, (_, i) => {
    const amount_kobo = 1000000 + Math.floor(Math.random() * 20000000);
    const userId = `u-mock-${i % 8}`;
    return {
        id: 1000 + i,
        org_id: 1,
        pool_id: `pool-${i % 4}`,
        target: 'member',
        beneficiaryId: userId,
        beneficiaryName: `User ${userId}`,
        sourceId: 1000 + i, // Mock source id
        user_id: userId,
        amount: amount_kobo / 100,
        amount_kobo: amount_kobo,
        currency: 'NGN',
        status: i % 4 === 0 ? 'pending' : i % 4 === 1 ? 'queued' : i % 4 === 2 ? 'settled' : 'failed',
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 86400000).toISOString(),
        approvals: i % 4 === 0 ? (i % 8 === 0 ? 1 : 0) : 2,
        provider: 'paystack',
        bank_account: {
            bank_code: ['058', '011', '033', '057'][i % 4],
            account_number: `...${1000 + i}`,
        },
        meta: {},
        can_queue: i % 4 === 0 && i % 8 === 0,
        split_code: i % 3 === 0 ? `SPL_xxxxxxxx${i}` : undefined,
        created_by: `user-00${i % 7 + 1}`,
        wallet_id: `w-mock-${i % 8}`,
    };
});

// FIX: Corrected mock Payout object to be compliant with the Payout type.
mockPayouts.push({
    id: 2000,
    org_id: 1,
    target: 'member',
    beneficiaryId: 'user-001',
    beneficiaryName: 'Mock User 001',
    sourceId: 2000, // Mock source id
    pool_id: '1',
    user_id: 'user-001',
    amount: 150000,
    amount_kobo: 15000000,
    currency: 'NGN',
    status: 'queued',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    approvals: 2,
    provider: 'paystack',
    bank_account: {
        bank_code: '044',
        account_number: '...9999',
    },
    meta: {},
    can_queue: true,
    created_by: 'user-001',
    deferred_until: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    wallet_id: 'w-mock-1',
});


let mockWebhooks: Webhook[] = Array.from({ length: 10 }, (_, i) => ({
    id: `wh-mock-${i}`,
    provider: 'paystack',
    event: i % 2 === 0 ? 'charge.success' : 'transfer.success',
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
}));

let mockPayoutEvents: Record<string, PayoutEvent[]> = {};
let mockLedgerEntries: Record<string, LedgerEntry[]> = {};

// Helper to generate mock data for timeline/ledger if it doesn't exist
const ensurePayoutData = (payoutId: number) => {
    if (!mockPayoutEvents[payoutId]) {
        mockPayoutEvents[payoutId] = [
            { event: 'created', note: 'Payout initiated by user.', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
            { event: 'approved', note: 'First approval received.', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
        ];
    }
    if (!mockLedgerEntries[payoutId]) {
        const payout = mockPayouts.find(p => p.id === payoutId);
        if (payout) {
            mockLedgerEntries[payoutId] = [
                { id: `le-debit-${payoutId}`, ts: new Date().toISOString(), wallet_id: payout.wallet_id!, amount_kobo: -(payout.amount_kobo || 0), code: 'PAYOUT_DEBIT', ref: String(payoutId) },
                { id: `le-credit-${payoutId}`, ts: new Date().toISOString(), wallet_id: 'psp-escrow', amount_kobo: payout.amount_kobo || 0, code: 'PAYOUT_ESCROW', ref: String(payoutId) },
            ];
        }
    }
};

mockPayouts.forEach(p => ensurePayoutData(p.id));

export async function getReconData(): Promise<{ wallets: Wallet[], payouts: Payout[], webhooks: Webhook[] }> {
    await new Promise(res => setTimeout(res, 500));
    return {
        wallets: [...mockWallets],
        payouts: [...mockPayouts],
        webhooks: [...mockWebhooks],
    };
}

// FIX: Changed payoutId to be a number for consistency
export async function approveSinglePayout(payoutId: number) {
    await new Promise(res => setTimeout(res, 400));
    const payout = mockPayouts.find(p => p.id === payoutId);
    if (payout && payout.status === 'pending') {
        payout.approvals = (payout.approvals || 0) + 1;
        if (payout.approvals >= 2) {
            payout.status = 'queued';
            payout.can_queue = true;
        } else {
            payout.can_queue = true; // after 1 approval
        }
        await logAdminAction('mock-admin-id', 'payout.approve', `payout:${payoutId}`, { new_status: payout.status, approvals: payout.approvals });
    }
    return { ok: true };
}

// FIX: Changed payoutId to be a number for consistency
export async function getPayoutTimeline(payoutId: number): Promise<{ events: PayoutEvent[], recent: Payout[], payout: Payout | undefined }> {
    await new Promise(res => setTimeout(res, 300));
    const payout = mockPayouts.find(p => p.id === payoutId);
    ensurePayoutData(payoutId);
    return {
        events: mockPayoutEvents[payoutId] || [],
        recent: mockPayouts.filter(p => p.wallet_id === payout?.wallet_id).slice(0, 10),
        payout: payout,
    };
}

// FIX: Changed payoutId to be a number for consistency
export async function getPayoutLedger(payoutId: number): Promise<LedgerEntry[]> {
    await new Promise(res => setTimeout(res, 300));
    ensurePayoutData(payoutId);
    return mockLedgerEntries[payoutId] || [];
}

// FIX: Changed payoutIds to be an array of numbers for consistency
export async function approveBulkPayouts(payoutIds: number[]) {
    await new Promise(res => setTimeout(res, 800));
    let count = 0;
    for (const id of payoutIds) {
        const payout = mockPayouts.find(p => p.id === id);
        if (payout && payout.status === 'pending') {
            payout.approvals = (payout.approvals || 0) + 1;
            if (payout.approvals >= 2) {
                payout.status = 'queued';
            }
            count++;
        }
    }
    await logAdminAction('mock-admin-id', 'payout.approve_bulk', `count:${count}`, { payout_ids: payoutIds });
    return { ok: true };
}

// FIX: Changed payoutIds to be an array of numbers for consistency
export async function approveBulkAndNotifyPayouts(
    payoutIds: number[],
    channels: NotificationChannel[] = ['toast', 'sms', 'email'],
    dispatch: boolean = false
): Promise<{ ok: true, notifications: number, channels: NotificationChannel[], dispatched: number, notification_ids: string[] }> {
    await new Promise(res => setTimeout(res, 1000));
    const newNotifications: Notification[] = [];
    let approvedCount = 0;
  
    for (const id of payoutIds) {
      const payout = mockPayouts.find(p => p.id === id);
      if (!payout || payout.status !== 'pending') continue;
  
      payout.approvals = (payout.approvals || 0) + 1;
      const willQueue = payout.approvals >= 2;
      if (willQueue) {
        payout.status = 'queued';
      }
      approvedCount++;
  
      const naira = Math.round((payout.amount_kobo || 0) / 100).toLocaleString();
      const title = willQueue ? 'Payout queued' : 'Payout approved (pending 2nd)';
      const body = willQueue
        ? `Your payout of ₦${naira} has been queued for transfer.`
        : `Your payout of ₦${naira} has 1 approval. Waiting for a second approver.`;
  
      if (payout.created_by) {
        newNotifications.push({
          id: `notif-${id}-creator-${Date.now()}`,
          recipient: payout.created_by,
          kind: 'toast',
          title,
          body,
          meta: { payout_id: id },
          created_at: new Date().toISOString(),
          read_at: null,
          delivery_status: 'pending',
          delivery_channels: [],
          tries: 0,
        });
      }

      // In a real app, you would fetch all finance admins.
      const financeAdminIds = ['admin-user-id-1', 'admin-user-id-2'];
      const titleA = willQueue ? `Payout queued: ₦${naira}` : `Approval needed: ₦${naira}`;
      const bodyA = willQueue ? `Payout ${id} is queued.` : `Payout ${id} needs a second approval.`;
      
      financeAdminIds.forEach(adminId => {
        newNotifications.push({
            id: `notif-${id}-admin-${adminId}-${Date.now()}`,
            recipient: adminId,
            kind: 'toast',
            title: titleA,
            body: bodyA,
            meta: { payout_id: id },
            created_at: new Date().toISOString(),
            read_at: null,
            delivery_status: 'pending',
            delivery_channels: [],
            tries: 0,
        });
      });
    }
  
    // Now, queue them for fan-out
    const notifIds = newNotifications.map(n => n.id);
    if (notifIds.length > 0) {
      await queueNotifications(notifIds, newNotifications, channels);
    }
    
    // Optionally dispatch now
    if (dispatch && notifIds.length > 0) {
        await dispatchNotifications();
    }

    await logAdminAction('mock-admin-id', 'payout.approve_bulk_notify', `count:${approvedCount}`, { payout_ids: payoutIds, notifications_generated: newNotifications.length });
  
    return { ok: true, notifications: newNotifications.length, channels, dispatched: dispatch ? newNotifications.length : 0, notification_ids: notifIds };
}
