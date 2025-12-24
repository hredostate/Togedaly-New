import React, { useState, useEffect, useCallback } from 'react';
import { getVelocityAlerts, resolveVelocityAlert, blockUser } from '../../../services/fraudService';
import type { VelocityAlert } from '../../../types';
import { useToasts } from '../../ToastHost';

const VelocityAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<VelocityAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const { add: addToast } = useToasts();

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        try {
            setAlerts(await getVelocityAlerts());
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load velocity alerts.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);
    
    const handleResolve = async (alertId: string) => {
        await resolveVelocityAlert(alertId);
        addToast({ title: 'Alert Resolved', desc: 'The alert has been dismissed.', emoji: '✅' });
        loadAlerts();
    };

    const handleBlock = async (userId: string) => {
        const reason = prompt('Reason for blocking this user?');
        if (reason) {
            await blockUser(userId, reason);
            addToast({ title: 'User Blocked', desc: 'The user has been blocked from the platform.', emoji: '🚫' });
            // Optionally, resolve all alerts for this user
            loadAlerts();
        }
    };

    if (loading) return <div className="text-center p-4">Loading velocity alerts...</div>;

    return (
        <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-lg">Active Velocity Alerts</h3>
            <div className="mt-2 space-y-2">
                {alerts.map(alert => (
                    <div key={alert.id} className="p-3 rounded-lg border bg-rose-50 border-rose-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold text-rose-900">{alert.rule}</div>
                                <div className="text-sm text-rose-800">User: <span className="font-mono">{alert.user_id}</span> • Value: {alert.value}</div>
                            </div>
                            <div className="text-xs text-rose-700">{new Date(alert.triggered_at).toLocaleString()}</div>
                        </div>
                        <div className="mt-2 flex gap-2">
                            <button onClick={() => handleResolve(alert.id)} className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-slate-50">Dismiss</button>
                            <button onClick={() => handleBlock(alert.user_id)} className="px-2 py-1 text-xs rounded-lg bg-rose-600 text-white">Block User</button>
                        </div>
                    </div>
                ))}
                {alerts.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No active velocity alerts. System is normal.</p>}
            </div>
        </div>
    );
};

export default VelocityAlerts;
