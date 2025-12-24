import type { AjoBoardEntry, AjoMemberDetails, AjoHistoryPoint, AjoMemberTimelineEntry, TtfEntry, MessageTemplate, NotificationChannel, NotificationStyle } from '../types';
import { mockAjoPayments, mockUserProfiles } from '../data/ajoMockData';
// FIX: Corrected import to use mockLegacyPools and aliased it as mockVentures.
import { mockLegacyPools as mockVentures } from '../data/mockData';
import { enqueueNotification } from './notificationService';

// --- MOCK TEMPLATE DATABASE ---
let mockTemplates: MessageTemplate[] = [
    { id: 'tpl-1', scope: 'global', channel: 'sms', code: 'ajo_due', tone: 'naija', name: 'Ajo Due (Naija)', body: 'Hi {{name}}, small reminder: {{title}} payment due {{due}}. No carry last.', updated_at: new Date().toISOString(), style: 'inapp_general' },
    { id: 'tpl-2', scope: 'global', channel: 'sms', code: 'ajo_late', tone: 'strict', name: 'Ajo Late (Strict)', body: 'Reminder: {{title}} payment is overdue by {{late_count}} periods. Please settle immediately.', updated_at: new Date(Date.now() - 86400000).toISOString(), style: 'inapp_general' },
    { id: 'tpl-3', scope: 'global', channel: 'whatsapp', code: 'ajo_due', tone: 'naija', name: 'Ajo Due WA', body: 'Hi {{name}}, {{title}} payment due {{due}}. You fit pay now to keep your streak 💪', updated_at: new Date().toISOString(), style: 'inapp_general' },
    { id: 'tpl-4', scope: 'global', channel: 'email', code: 'ajo_due', tone: 'formal', name: 'Ajo Due Email', body: 'Dear {{name}},\nThis is a reminder that your {{title}} payment is due {{due}}.\nThank you.', updated_at: new Date().toISOString(), style: 'inapp_general' },
];


// --- AJO HEALTH & GROUP DETAIL ---

export async function getAjoBoard(): Promise<AjoBoardEntry[]> {
    await new Promise(res => setTimeout(res, 500));
    // FIX: Renamed `vtype` to `poolType` to match `Pool` type.
    const ajoVenture = mockVentures.find(v => v.poolType === 'ajo');
    if (!ajoVenture) return [];

    const payments = mockAjoPayments;
    const members = Array.from(new Set(payments.map(p => p.user_id)));
    const onTimePayments = payments.filter(p => p.paid_at && new Date(p.paid_at) <= new Date(p.due_date));
    
    const latePaymentsByUser: Record<string, number> = {};
    payments.forEach(p => {
        if (!p.paid_at && new Date() > new Date(p.due_date)) {
            latePaymentsByUser[p.user_id] = (latePaymentsByUser[p.user_id] || 0) + 1;
        }
    });

    const missers = Object.values(latePaymentsByUser).filter(count => count >= 1).length;
    const defaulters = Object.values(latePaymentsByUser).filter(count => count >= 2).length;
    
    const nextDue = payments
        .filter(p => !p.paid_at && new Date(p.due_date) >= new Date())
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]?.due_date;

    return [{
        group_id: ajoVenture.id,
        // FIX: Renamed `title` to `name` to match `Pool` type.
        title: ajoVenture.name,
        created_at: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
        members: members.length,
        contributed_ngn: payments.filter(p => p.paid_at).reduce((sum, p) => sum + p.amount_kobo, 0) / 100,
        on_time_ratio: payments.length > 0 ? onTimePayments.length / payments.filter(p => p.paid_at).length : 0,
        missers,
        defaulters,
        next_due: nextDue || null,
    }];
}

export async function getAjoGroupDetails(groupId: string): Promise<{ board: AjoBoardEntry; members: AjoMemberDetails[]; history: AjoHistoryPoint[] }> {
    await new Promise(res => setTimeout(res, 600));
    const [boardData] = await getAjoBoard();
    
    const membersData: AjoMemberDetails[] = mockUserProfiles.slice(0, 7).map(user => {
        const userPayments = mockAjoPayments.filter(p => p.user_id === user.id);
        const periods_due = userPayments.length;
        const periods_paid = userPayments.filter(p => p.paid_at).length;
        const periods_missed = userPayments.filter(p => !p.paid_at && new Date() > new Date(p.due_date)).length;
        const paid_kobo = userPayments.filter(p => p.paid_at).reduce((sum, p) => sum + p.amount_kobo, 0);
        const next_due = userPayments.find(p => !p.paid_at)?.due_date;

        return {
            group_id: groupId,
            user_id: user.id,
            member_name: user.name,
            periods_due,
            periods_paid,
            periods_missed,
            next_due: next_due || null,
            paid_kobo,
        };
    });

    const historyData: AjoHistoryPoint[] = []; // Simplified for mock

    return { board: boardData, members: membersData, history: historyData };
}

export async function getAjoMemberTimeline(groupId: string, userId: string): Promise<AjoMemberTimelineEntry[]> {
    await new Promise(res => setTimeout(res, 400));
    const userPayments = mockAjoPayments.filter(p => p.group_id === groupId && p.user_id === userId);
    
    return userPayments.map(p => {
        let status: 'paid' | 'late' | 'due' | 'paid_late' = 'due';
        if (p.paid_at) {
            status = new Date(p.paid_at) <= new Date(p.due_date) ? 'paid' : 'paid_late';
        } else if (new Date() > new Date(p.due_date)) {
            status = 'late';
        }
        return {
            due_date: p.due_date,
            paid_at: p.paid_at,
            amount_kobo: p.amount_kobo,
            status,
        };
    }).sort((a,b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
}

export async function remindAjoMember(
    groupId: string,
    userId: string,
    channel: NotificationChannel,
    body: string,
    tone: 'naija' | 'formal' | 'strict',
    code?: string
): Promise<{ ok: true }> {
    console.log(`MOCK: remindAjoMember`, { groupId, userId, channel, body, tone, code });
    await new Promise(res => setTimeout(res, 500));
    
    // 1. Fetch Context
    const venture = mockVentures.find(v => v.id === groupId);
    const member = mockUserProfiles.find(u => u.id === userId);
    const timeline = await getAjoMemberTimeline(groupId, userId);
    
    const nextDueEntry = timeline.find(t => t.status === 'due');
    const lateCount = timeline.filter(t => t.status === 'late').length;

    // 2. Tiny {{var}} renderer
    function render(tpl: string, vars: Record<string, any>) {
        return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_: any, k: string) => (vars[k] ?? '').toString());
    }

    // 3. Pick template code if not given
    const inferredCode = code || (nextDueEntry ? 'ajo_due' : (lateCount > 0 ? 'ajo_late' : 'ajo_due'));

    // 4. Resolve template
    let resolvedBody: string | null = null;
    const template = mockTemplates.find(t => t.scope === 'global' && t.channel === channel && t.code === inferredCode && t.tone === tone);

    if (template?.body) {
        resolvedBody = render(template.body, {
            name: member?.name || 'Member',
            // FIX: Renamed `title` to `name` to match `Pool` type.
            title: venture?.name || 'Ajo',
            due: nextDueEntry ? new Date(nextDueEntry.due_date).toLocaleDateString() : '',
            late_count: lateCount,
        });
    }

    // 5. Final body: explicit body > template > default
    const finalMessage = (typeof body === 'string' && body.trim().length > 0)
        ? body.trim()
        : (resolvedBody || (() => {
            // Fallback message composition
            const dueTxt = nextDueEntry ? `due ${new Date(nextDueEntry.due_date).toLocaleDateString()}` : 'due soon';
            // FIX: Renamed `title` to `name` to match `Pool` type.
            if (tone === 'strict') return `Reminder: ${(venture?.name)||'Ajo'} payment ${dueTxt}. Please settle immediately to maintain standing.`;
            if (tone === 'formal') return `Dear ${(member?.name)||'Member'}, your ${(venture?.name)||'Ajo'} payment is ${dueTxt}. Thank you.`;
            return `Hi ${(member?.name)||'Member'}, small reminder: ${(venture?.name)||'Ajo'} payment ${dueTxt}. ${lateCount > 0 ? `You missed ${lateCount} before—make we balance am.` : 'No carry last.'}`;
        })());

    // 6. Enqueue the notification
    // FIX: Renamed `title` to `name` to match `Pool` type.
    await enqueueNotification(channel, 'inapp_general', { // Using general code for mock simplicity
        title: `Ajo Reminder for ${venture?.name}`,
        body: finalMessage
    });

    return { ok: true };
}


// --- TTF LEADERBOARD ---

export async function getTtfLeaderboard(scope: 'members' | 'groups', days: number, minPayments: number): Promise<TtfEntry[]> {
    await new Promise(res => setTimeout(res, 500));

    const getTtfHours = (p: typeof mockAjoPayments[0]) => (new Date(p.paid_at!).getTime() - new Date(p.due_date).getTime()) / 3600000;

    // FIX: Renamed `vtype` to `poolType` to match `Pool` type.
    const ajoVenture = mockVentures.find(v => v.poolType === 'ajo')!;

    if (scope === 'groups') {
        const payments = mockAjoPayments.filter(p => p.paid_at);
        const avg_ttf_hours = payments.reduce((sum, p) => sum + getTtfHours(p), 0) / payments.length;
        return [{
            group_id: ajoVenture.id,
            // FIX: Renamed `title` to `name` to match `Pool` type.
            title: ajoVenture.name,
            members: 7,
            payments_done: payments.length,
            avg_ttf_hours: avg_ttf_hours,
            p50_ttf_hours: avg_ttf_hours - 1, // mock
            early_ratio: payments.filter(p => getTtfHours(p) <= 0).length / payments.length,
            last_activity: new Date().toISOString(),
        }];
    } else { // members
        return mockUserProfiles.slice(0, 7).map(user => {
            const payments = mockAjoPayments.filter(p => p.user_id === user.id && p.paid_at);
            if (payments.length < minPayments) return null;
            const avg_ttf_hours = payments.reduce((sum, p) => sum + getTtfHours(p), 0) / payments.length;
            return {
                group_id: ajoVenture.id,
                // FIX: Renamed `title` to `name` to match `Pool` type.
                title: ajoVenture.name,
                user_id: user.id,
                member_name: user.name,
                payments_done: payments.length,
                avg_ttf_hours,
                p50_ttf_hours: avg_ttf_hours - Math.random() * 2,
                early_ratio: payments.filter(p => getTtfHours(p) <= 0).length / payments.length,
                last_activity: new Date().toISOString(),
            };
        }).filter(Boolean).sort((a, b) => a!.avg_ttf_hours - b!.avg_ttf_hours) as TtfEntry[];
    }
}

export async function getTtfPreview(groupId: string, userId?: string) {
     await new Promise(res => setTimeout(res, 400));
     // Return some plausible static data for the hover preview
     const paymentsForUser = mockAjoPayments.filter(p => p.user_id === userId).slice(0,5);
     const paid = paymentsForUser.filter(p => p.paid_at);
     const getTtfHours = (p: typeof mockAjoPayments[0]) => (new Date(p.paid_at!).getTime() - new Date(p.due_date).getTime()) / 3600000;
     const avg_ttf_hours = paid.length > 0 ? paid.reduce((s, r) => s + getTtfHours(r), 0) / paid.length : null;

     return {
         last5: paymentsForUser.map(p => ({ due: p.due_date, paid: p.paid_at, ttf_hours: p.paid_at ? getTtfHours(p) : 999, amount: p.amount_kobo / 100 })),
         paid: paid.length,
         early_pct: paid.length? paid.filter(p => getTtfHours(p) <= 0).length / paid.length : 0,
         avg_ttf_hours,
     };
}

// --- TEMPLATE MANAGER ---

export async function getMessageTemplates(): Promise<MessageTemplate[]> {
    await new Promise(res => setTimeout(res, 300));
    return mockTemplates;
}

export async function upsertMessageTemplate(template: Omit<MessageTemplate, 'id' | 'updated_at'> & { id?: string }): Promise<MessageTemplate> {
    await new Promise(res => setTimeout(res, 500));
    if (template.id && template.id.startsWith('tpl-')) {
        const index = mockTemplates.findIndex(t => t.id === template.id);
        if (index > -1) {
            mockTemplates[index] = { ...mockTemplates[index], ...template, updated_at: new Date().toISOString() };
            return mockTemplates[index];
        }
    }
    const newTemplate = { ...template, id: `tpl-${Date.now()}`, updated_at: new Date().toISOString() } as MessageTemplate;
    mockTemplates.push(newTemplate);
    return newTemplate;
}

export async function deleteMessageTemplate(id: string): Promise<void> {
    await new Promise(res => setTimeout(res, 400));
    mockTemplates = mockTemplates.filter(t => t.id !== id);
}

// --- NUDGES ---
export async function getNudges(groupId: string, userId?: string, filters?: any) {
    await new Promise(res => setTimeout(res, 400));
    const userIds = userId ? [userId] : Array.from(new Set(mockAjoPayments.filter(p => p.group_id === groupId).map(p => p.user_id)));
    
    // Simulate some nudge history
    const nudges = userIds.flatMap(uid => ([
        { user_id: uid, channel: 'sms', code: 'ajo_due', created_at: new Date(Date.now() - 86400000).toISOString(), payload: { body: 'Hi, friendly reminder...' }},
        { user_id: uid, channel: 'email', code: 'ajo_due', created_at: new Date(Date.now() - 172800000).toISOString(), payload: { body: 'Dear member, reminder...' }}
    ])).slice(0, 10);

    return {
        rows: nudges,
        total: nudges.length,
        summary: { sms: userIds.length, email: userIds.length }
    };
}