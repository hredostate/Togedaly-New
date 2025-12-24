import React, { useState, useEffect, useCallback } from 'react';
import { getRecentBackups, triggerManualBackup } from '../../services/backupService';
import { useToasts } from '../ToastHost';

interface Backup {
    stamp: string;
    tables: string[];
}

const Backups: React.FC = () => {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);
    const { add: addToast } = useToasts();

    const loadBackups = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRecentBackups();
            setBackups(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load backup history.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadBackups();
    }, [loadBackups]);

    const handleTrigger = async () => {
        setIsTriggering(true);
        try {
            const result = await triggerManualBackup();
            addToast({ title: 'Backup Started', desc: `Manual backup for ${result.stamp} has been queued.`, emoji: '🚀' });
            loadBackups(); // Refresh the list
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Failed to trigger backup.', emoji: '😥' });
        } finally {
            setIsTriggering(false);
        }
    };
    
    const handleDownload = (stamp: string) => {
        // This is a mock download
        addToast({ title: 'Download Started', desc: `Preparing download for ${stamp}...`, emoji: '📄' });
        console.log(`MOCK: Downloading backup for ${stamp}`);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 flex justify-between items-center">
                <div>
                    <h2 className="font-semibold text-lg">Database Backups</h2>
                    <p className="text-sm text-gray-500">Nightly logical exports of critical tables.</p>
                </div>
                <button 
                    onClick={handleTrigger}
                    disabled={isTriggering}
                    className="px-4 py-2 rounded-xl bg-brand text-white font-semibold disabled:opacity-50"
                >
                    {isTriggering ? 'Triggering...' : 'Trigger Manual Backup'}
                </button>
            </div>

            <div className="rounded-2xl border bg-white p-4">
                <h3 className="font-semibold mb-2">Recent Backups</h3>
                {loading ? (
                    <div className="text-center p-4">Loading backup history...</div>
                ) : (
                    <div className="space-y-2">
                        {backups.map(backup => (
                            <div key={backup.stamp} className="p-3 rounded-lg border bg-slate-50 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-gray-800">Backup - {backup.stamp.replace(/\//g, '-')}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                                        {backup.tables.map(t => <span key={t} className="px-2 py-0.5 rounded bg-slate-200 text-slate-700">{t}</span>)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownload(backup.stamp)}
                                    className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-slate-100"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                        {backups.length === 0 && <div className="text-center p-6 text-gray-500">No backups found.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Backups;
