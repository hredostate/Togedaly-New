import React, { useState, useEffect } from 'react';
import type { UserNudgePrefs } from '../types';
import { getUserNudgePrefs, updateUserNudgePrefs } from '../services/nudgeService';
import { useToasts } from './ToastHost';

const NudgePrefs: React.FC = () => {
    const [prefs, setPrefs] = useState<Partial<UserNudgePrefs>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { add: addToast } = useToasts();
    
    useEffect(() => {
        setLoading(true);
        getUserNudgePrefs('mock-user-id')
            .then(setPrefs)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserNudgePrefs('mock-user-id', prefs);
            addToast({ title: 'Nudge Settings Saved', desc: 'Your preferences have been updated.', emoji: '👍'});
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not save nudge settings.', emoji: '😥' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-4">Loading nudge preferences...</div>;
    }
    
    return (
        <div className="rounded-2xl p-4 bg-white border space-y-3">
            <h3 className="font-medium">AI Coach "Aunty Cashflow" Nudges</h3>
            <label className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50 border has-[:checked]:bg-rose-50 has-[:checked]:border-rose-200">
                <span>Do Not Disturb (DND)</span>
                <input type="checkbox" className="h-4 w-4 rounded" checked={!!prefs.dnd} onChange={e => setPrefs({...prefs, dnd: e.target.checked})} />
            </label>
            <div className="space-y-2">
                 <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!prefs.allow_push} onChange={e => setPrefs({...prefs, allow_push: e.target.checked})} /> Allow Push Notifications
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!prefs.allow_voice} onChange={e => setPrefs({...prefs, allow_voice: e.target.checked})} /> Allow Voice Calls
                </label>
                 <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!prefs.allow_sms} onChange={e => setPrefs({...prefs, allow_sms: e.target.checked})} /> Allow SMS
                </label>
                 <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!prefs.allow_email} onChange={e => setPrefs({...prefs, allow_email: e.target.checked})} /> Allow Email
                </label>
                 <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!prefs.allow_inapp} onChange={e => setPrefs({...prefs, allow_inapp: e.target.checked})} /> Allow In-App Messages
                </label>
            </div>
            {/* The main save button from the parent component will handle saving this. */}
        </div>
    );
};

export default NudgePrefs;