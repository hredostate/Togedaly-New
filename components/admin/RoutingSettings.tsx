// components/admin/RoutingSettings.tsx
import React, { useState, useCallback } from 'react';
import { getRoutingPrefs, updateRoutingPrefs } from '../../services/routingService';
import type { WalletRoutingPrefs } from '../../types';
import { useToasts } from '../ToastHost';

const RoutingSettings: React.FC = () => {
    const [userId, setUserId] = useState('mock-user-id');
    const [prefs, setPrefs] = useState<Partial<WalletRoutingPrefs> | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { add: addToast } = useToasts();
    
    const loadPrefs = useCallback(async () => {
        if (!userId) {
            addToast({ title: 'User ID Required', desc: 'Please enter a user ID to load preferences.', emoji: '🆔' });
            return;
        }
        setLoading(true);
        setPrefs(null);
        try {
            const data = await getRoutingPrefs(userId);
            setPrefs(data || { default_destination: 'wallet' }); // Provide a default empty state
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not load preferences.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [userId, addToast]);
    
    const savePrefs = async () => {
        if (!userId || !prefs) return;
        setSaving(true);
        try {
            // FIX: Robustly handle memo_overrides which can be a string from the textarea or an object from the API.
            let parsedOverrides = null;
            const memoOverridesValue = prefs.memo_overrides as any;
            if (typeof memoOverridesValue === 'string' && memoOverridesValue.trim()) {
                try {
                    parsedOverrides = JSON.parse(memoOverridesValue);
                } catch {
                    addToast({ title: 'Invalid JSON', desc: 'Memo Overrides must be valid JSON.', emoji: '⚠️' });
                    setSaving(false);
                    return;
                }
            } else if (typeof memoOverridesValue === 'object' && memoOverridesValue !== null) {
                // If it's already an object, pass it through.
                parsedOverrides = memoOverridesValue;
            }

            const payload = { ...prefs, memo_overrides: parsedOverrides };
            await updateRoutingPrefs(userId, payload);
            addToast({ title: 'Success!', desc: 'Routing preferences have been saved.', emoji: '✅' });
        } catch (e: any) {
             addToast({ title: 'Error', desc: e.message || 'Could not save preferences.', emoji: '😥' });
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">DVA Routing Preferences</h2>
            <div className="rounded-2xl border bg-white p-4">
                <div className="flex gap-2 items-center">
                    <input 
                        value={userId} 
                        onChange={e => setUserId(e.target.value)} 
                        placeholder="Enter User ID"
                        className="border rounded-xl px-3 py-2 text-sm flex-grow"
                    />
                    <button onClick={loadPrefs} disabled={loading} className="px-4 py-2 text-sm rounded-xl border hover:bg-slate-100 disabled:opacity-50">
                        {loading ? 'Loading...' : 'Load User'}
                    </button>
                </div>
            </div>
            
            {prefs && (
                <div className="rounded-2xl border bg-white p-4 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                            <label className="font-medium">Default Destination</label>
                            <select 
                                value={prefs.default_destination || 'wallet'} 
                                onChange={e => setPrefs({ ...prefs, default_destination: e.target.value as any })}
                                className="w-full mt-1 border rounded-xl px-3 py-2 bg-white"
                            >
                                <option value="wallet">Wallet</option>
                                <option value="ajo">Ajo</option>
                                <option value="group_buy">Group Buy</option>
                                <option value="invest">Investment</option>
                            </select>
                        </div>
                         <div>
                            <label className="font-medium">Destination ID (optional)</label>
                            <input
                                value={prefs.default_destination_id || ''}
                                onChange={e => setPrefs({ ...prefs, default_destination_id: e.target.value })}
                                placeholder="Pool ID, etc."
                                className="w-full mt-1 border rounded-xl px-3 py-2"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="font-medium text-sm">Memo Overrides (JSON)</label>
                        <textarea 
                            // FIX: Use `as any` to acknowledge that the state is temporarily holding a string for a property typed as an object.
                            value={typeof prefs.memo_overrides === 'object' && prefs.memo_overrides !== null ? JSON.stringify(prefs.memo_overrides, null, 2) : (prefs.memo_overrides as any) || ''}
                            onChange={e => setPrefs({ ...prefs, memo_overrides: e.target.value as any })}
                            rows={5}
                            placeholder={`{ "AJO-COWSHARE": { "dest": "ajo", "id": "..." } }`}
                            className="w-full mt-1 border rounded-xl px-3 py-2 text-sm font-mono"
                        />
                    </div>
                    <button onClick={savePrefs} disabled={saving} className="px-4 py-2 text-sm rounded-xl bg-slate-900 text-white disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoutingSettings;