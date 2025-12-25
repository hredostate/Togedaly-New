import type { UserNudgePrefs, Nudge, NudgeStat, NudgeBucket, NotificationChannel as NudgeChannel } from '../types';

// In-memory stores (to be replaced with real DB)
let userNudgePrefs: UserNudgePrefs[] = [];
let nudges: Nudge[] = [];
let nudgeAssignments: Array<{ user_id: string; experiment_id: number; bucket: NudgeBucket }> = [];
let nudgeExperiments: Array<{ id: number; key: string }> = [];
let nudgeOutcomes: Array<{ id: number; nudge_id: number; otype: string }> = [];
let nudgeTemplates: Array<{ id: number; key: string; payload: { user_template: string } }> = [];

// --- PREFERENCES ---
export async function getUserNudgePrefs(userId: string): Promise<Partial<UserNudgePrefs>> {
    await new Promise(res => setTimeout(res, 200));
    const prefs = userNudgePrefs.find(p => p.user_id === userId);
    return prefs || {
        dnd: false, quiet_start: '21:00', quiet_end: '07:00',
        allow_push: true, allow_voice: true, allow_sms: true, allow_email: true, allow_inapp: true
    };
}

export async function updateUserNudgePrefs(userId: string, updates: Partial<UserNudgePrefs>): Promise<UserNudgePrefs> {
    await new Promise(res => setTimeout(res, 400));
    let prefs = userNudgePrefs.find(p => p.user_id === userId);
    if (prefs) {
        Object.assign(prefs, updates);
        prefs.updated_at = new Date().toISOString();
    } else {
        prefs = {
            user_id: userId,
            dnd: false,
            quiet_start: '21:00',
            quiet_end: '06:00',
            allow_push: true,
            allow_voice: true,
            allow_sms: true,
            allow_email: true,
            allow_inapp: true,
            locale: 'en-NG',
            ...updates,
            updated_at: new Date().toISOString(),
        };
        userNudgePrefs.push(prefs);
    }
    return { ...prefs };
}

// --- A/B STATS ---
export async function getNudgeStats(): Promise<NudgeStat[]> {
    await new Promise(res => setTimeout(res, 600));
    const stats: NudgeStat[] = [];

    for (const exp of nudgeExperiments) {
        const assignments = nudgeAssignments.filter(a => a.experiment_id === exp.id);
        const buckets = Array.from(new Set(assignments.map(a => a.bucket)));

        for (const bucket of buckets) {
            const expNudges = nudges.filter(n => n.experiment_id === exp.id && n.bucket === bucket && ['sent', 'delivered'].includes(n.status));
            const outcomes = nudgeOutcomes.filter(o => expNudges.some(n => n.id === o.nudge_id));
            
            const clicks = outcomes.filter(o => o.otype === 'click').length;
            const repayments = outcomes.filter(o => o.otype === 'repayment').length;
            const joins = outcomes.filter(o => o.otype === 'join_pool').length;
            const nudges_sent = expNudges.length;
            
            stats.push({
                experiment_id: exp.id,
                key: exp.key,
                bucket,
                nudges_sent,
                clicks,
                repayments,
                joins,
                ctr_pct: nudges_sent > 0 ? parseFloat(((clicks / nudges_sent) * 100).toFixed(2)) : 0,
            });
        }
    }
    return stats;
}


// --- MOCK NUDGE SENDING ---
function inQuietHours(now: Date, quietStart = '21:00', quietEnd = '06:00') {
    const [sH, sM] = quietStart.split(':').map(Number);
    const [eH, eM] = quietEnd.split(':').map(Number);
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();

    const startTotalMinutes = sH * 60 + sM;
    const endTotalMinutes = eH * 60 + eM;
    const nowTotalMinutes = nowHours * 60 + nowMinutes;

    if (startTotalMinutes <= endTotalMinutes) { // Same day (e.g., 09:00-17:00)
        return nowTotalMinutes >= startTotalMinutes && nowTotalMinutes < endTotalMinutes;
    } else { // Overnight (e.g., 21:00-07:00)
        return nowTotalMinutes >= startTotalMinutes || nowTotalMinutes < endTotalMinutes;
    }
}


function craftNudgeText(template: string, features: any, bucket: NudgeBucket): string {
    const filled = template
        .replace('{first_name}', features.first_name || 'friend')
        .replace('{cta_url}', features.cta_url || '#')
        .replace('{amount_due}', String(features.amount_due || ''))
        .replace('{unlock_amt}', String(features.unlock_amt || ''));
    return `${filled} [Variant: ${bucket}]`;
}


export async function sendTestNudge(userId: string, templateKey: string, channel: NudgeChannel): Promise<Nudge> {
    console.log(`sendTestNudge`, { userId, templateKey, channel });
    await new Promise(res => setTimeout(res, 1000));
    
    const prefs = await getUserNudgePrefs(userId);
    const now = new Date();

    if (prefs.dnd) {
        throw new Error('User has DND enabled.');
    }
    if (inQuietHours(now, prefs.quiet_start, prefs.quiet_end)) {
        throw new Error('User is in quiet hours.');
    }

    const template = nudgeTemplates.find(t => t.key === templateKey);
    if (!template) throw new Error('Template not found');

    const assignment = nudgeAssignments.find(a => a.user_id === userId) || { bucket: 'control' as NudgeBucket };
    const text = craftNudgeText(template.payload.user_template, { first_name: 'Test User' }, assignment.bucket);

    const newNudge: Nudge = {
        id: Date.now(),
        user_id: userId,
        template_id: template.id,
        experiment_id: nudgeExperiments[0]?.id || 1,
        bucket: assignment.bucket,
        channel,
        content: text,
        tts_url: channel === 'voice' ? 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAA==' : undefined, // dummy mp3
        status: 'sent',
        quiet_skipped: false,
        dnd_skipped: false,
        meta: { test: true },
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
    };
    nudges.push(newNudge);

    return newNudge;
}