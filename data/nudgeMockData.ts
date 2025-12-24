import type { NudgeExperiment, NudgeTemplate, Nudge, UserNudgePrefs, NudgeAssignment, NudgeOutcome } from '../types';

export const mockNudgeExperiments: NudgeExperiment[] = [
    { id: 1, key: 'tone_cta_v1', description: 'Test different tones and CTAs for repayment reminders', is_active: true, created_at: new Date().toISOString() }
];

export const mockNudgeTemplates: NudgeTemplate[] = [
    { id: 1, key: 'repayment_reminder_v1', channel: 'voice', audience: 'v_users_due_today', payload: { persona: 'Aunty Cashflow', user_template: 'Oya {first_name}, you said you’ll pay today. If you settle {amount_due} now, your trust score go smile and your next unlock go land faster. Need the link? {cta_url}' }, is_active: true, created_at: new Date().toISOString() },
    { id: 2, key: 'join_pool_invite_v1', channel: 'push', audience: '*', payload: { persona: 'Aunty Cashflow', user_template: '{first_name}, gist don land. This pool dey move. Small small contributions, big big leverage. Wanna join? {cta_url}' }, is_active: true, created_at: new Date().toISOString() },
];

export let mockUserNudgePrefs: UserNudgePrefs[] = [
    {
        user_id: 'mock-user-id',
        dnd: false,
        quiet_start: '21:00',
        quiet_end: '07:00',
        allow_push: true,
        allow_voice: true,
        allow_sms: false,
        allow_email: true,
        allow_inapp: true,
        locale: 'en-NG',
        updated_at: new Date().toISOString(),
    }
];

export const mockNudgeAssignments: NudgeAssignment[] = [
    { experiment_id: 1, user_id: 'mock-user-id', bucket: 'A', assigned_at: new Date().toISOString() },
    { experiment_id: 1, user_id: 'user-002', bucket: 'B', assigned_at: new Date().toISOString() },
    { experiment_id: 1, user_id: 'user-003', bucket: 'control', assigned_at: new Date().toISOString() },
];

export let mockNudges: Nudge[] = [
    { id: 1, user_id: 'mock-user-id', template_id: 1, experiment_id: 1, bucket: 'A', channel: 'voice', content: 'Oya mock-user, you said you’ll pay today...', tts_url: '/mock-audio.mp3', status: 'delivered', quiet_skipped: false, dnd_skipped: false, meta: {}, created_at: new Date(Date.now() - 86400000).toISOString(), sent_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 2, user_id: 'user-002', template_id: 1, experiment_id: 1, bucket: 'B', channel: 'sms', content: 'Hey user-002, time to pay up!', status: 'sent', quiet_skipped: false, dnd_skipped: false, meta: {}, created_at: new Date(Date.now() - 86400000).toISOString(), sent_at: new Date(Date.now() - 86400000).toISOString() },
];

export const mockNudgeOutcomes: NudgeOutcome[] = [
    { id: 1, nudge_id: 1, user_id: 'mock-user-id', otype: 'click', created_at: new Date(Date.now() - 86300000).toISOString(), meta: {} },
    { id: 2, nudge_id: 1, user_id: 'mock-user-id', otype: 'repayment', value: 20000, created_at: new Date(Date.now() - 86200000).toISOString(), meta: {} },
];