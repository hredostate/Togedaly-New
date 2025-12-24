
import React, { useEffect, useState } from 'react';
import type { Page } from '../App';
import type { UserNotificationPrefs, NotificationChannel } from '../types';
import { getUserNotificationPrefs, updateUserNotificationPrefs } from '../services/notificationService';
import { useToasts } from '../components/ToastHost';
import NudgePrefs from '../components/NudgePrefs';
import { supabase } from '../supabaseClient';
import { useSettings } from '../components/SettingsContext';

const Notifications: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [prefs, setPrefs] = useState<Partial<UserNotificationPrefs> | null>(null);
    const { settings, updateSettings, loading: settingsLoading } = useSettings();
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const { add: addToast } = useToasts();
    const [userId, setUserId] = useState<string | null>(null);

     useEffect(() => {
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
            } else {
                addToast({ title: 'Not authenticated', desc: 'Please sign in to view settings.', emoji: '🔒'});
                setPage('auth');
            }
        });
    }, [addToast, setPage]);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        getUserNotificationPrefs(userId)
            .then(setPrefs)
            .catch(() => addToast({ title: 'Error', desc: 'Could not load notification settings.', emoji: '😥' }))
            .finally(() => setLoading(false));
    }, [userId, addToast]);
    
    const save = async () => {
        if (!prefs || !userId) return;
        setBusy(true);
        try {
            await updateUserNotificationPrefs(userId, prefs);
            addToast({ title: 'Saved!', desc: 'Your preferences have been updated.', emoji: '✅' });
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not save settings.', emoji: '😥' });
        } finally {
            setBusy(false);
        }
    };

    if (loading || settingsLoading || !prefs) {
        return <div className="max-w-2xl mx-auto p-4">Loading preferences...</div>;
    }

    const dc = prefs.default_channels || [];
    const onToggle = (ch: NotificationChannel, v: boolean) => {
        const s = new Set(dc);
        v ? s.add(ch) : s.delete(ch);
        setPrefs({ ...prefs, default_channels: Array.from(s) });
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <button onClick={() => setPage('dashboard')} className="text-sm text-gray-600 hover:text-brand transition">← Back to Dashboard</button>
            <h2 className="text-2xl font-semibold">Settings &amp; Preferences</h2>
            
            {/* Security Link for easier access on Mobile */}
            <div 
                className="rounded-2xl p-4 bg-white border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 hover:border-brand-200 transition group shadow-sm" 
                onClick={() => setPage('security')}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">Security Center</div>
                        <div className="text-xs text-gray-500">Manage devices, KYC, and account security</div>
                    </div>
                </div>
                <div className="text-gray-300 group-hover:text-brand-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            <div className="rounded-2xl p-4 bg-white border space-y-3">
                <div className="font-medium">Notification Channels</div>
                <p className="text-sm text-gray-500">Select the default ways you want to receive notifications.</p>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dc.includes('toast')} onChange={e => onToggle('toast', e.currentTarget.checked)} /> Toast (In-app pop-up)</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dc.includes('sms')} onChange={e => onToggle('sms', e.currentTarget.checked)} /> SMS</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dc.includes('email')} onChange={e => onToggle('email', e.currentTarget.checked)} /> Email</label>
            </div>
            
            <div className="rounded-2xl p-4 bg-white border space-y-3">
                <div className="font-medium">Quiet hours</div>
                 <p className="text-sm text-gray-500">Suppress SMS and email notifications during this window.</p>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!prefs.quiet_hours?.enabled} onChange={e => setPrefs({ ...prefs, quiet_hours: { ...(prefs.quiet_hours || {}), enabled: e.currentTarget.checked } as any })} /> Enable Quiet Hours
                </label>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    <input className="border rounded-xl px-3 py-2 disabled:bg-slate-50" disabled={!prefs.quiet_hours?.enabled} type="time" value={prefs.quiet_hours?.from || '22:00'} onChange={e => setPrefs({ ...prefs, quiet_hours: { ...(prefs.quiet_hours || {}), from: e.target.value } as any })} />
                    <input className="border rounded-xl px-3 py-2 disabled:bg-slate-50" disabled={!prefs.quiet_hours?.enabled} type="time" value={prefs.quiet_hours?.to || '06:00'} onChange={e => setPrefs({ ...prefs, quiet_hours: { ...(prefs.quiet_hours || {}), to: e.target.value } as any })} />
                    <input className="border rounded-xl px-3 py-2 disabled:bg-slate-50" disabled={!prefs.quiet_hours?.enabled} value={prefs.quiet_hours?.tz || 'Africa/Lagos'} onChange={e => setPrefs({ ...prefs, quiet_hours: { ...(prefs.quiet_hours || {}), tz: e.target.value } as any })} placeholder="Timezone" />
                </div>
            </div>

            <div className="rounded-2xl p-4 bg-white border space-y-3">
                <div className="font-medium">Accessibility & Language</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <label htmlFor="ui_language" className="font-medium text-gray-700">Language</label>
                        <select 
                            id="ui_language" 
                            value={settings.ui_language || 'en'} 
                            onChange={e => updateSettings({ ui_language: e.target.value as any })} 
                            className="w-full mt-1 border rounded-xl px-3 py-2 bg-white"
                        >
                            <option value="en">English</option>
                            <option value="pidgin">Naija Pidgin (Beta)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="coach_tone" className="font-medium text-gray-700">AI Coach Tone</label>
                        <select 
                            id="coach_tone" 
                            value={settings.coach_tone || 'playful'} 
                            onChange={e => updateSettings({ coach_tone: e.target.value as any })} 
                            className="w-full mt-1 border rounded-xl px-3 py-2 bg-white"
                        >
                            <option value="playful">Naija Pidgin Coach (Playful)</option>
                            <option value="formal">Formal English</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input 
                            type="checkbox" 
                            checked={!!settings.screen_reader_mode} 
                            onChange={e => updateSettings({ screen_reader_mode: e.target.checked })} 
                        /> Enable Screen Reader Mode
                    </label>
                     <label className="flex items-center gap-2 text-sm">
                        <input 
                            type="checkbox" 
                            checked={!!settings.high_contrast_mode} 
                            onChange={e => updateSettings({ high_contrast_mode: e.target.checked })} 
                        /> Enable High Contrast Mode
                    </label>
                </div>
            </div>
            
            <NudgePrefs />

            <div className="flex gap-2 pb-10">
                <button onClick={save} disabled={busy || loading} className="px-3 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50 w-full font-semibold">
                    {busy ? 'Saving...' : 'Save All Preferences'}
                </button>
            </div>
        </div>
    );
};

export default Notifications;
