import React, { useEffect, useState } from 'react';
import { getAuditTrail } from '../../services/adminService';
import type { AuditLog } from '../../types';

const AuditTrail: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditTrail().then(data => {
            setLogs(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-center p-4">Loading audit trail...</div>;
    
    return (
        <div className="rounded-2xl border bg-white">
            <div className="p-4 border-b">
                 <h2 className="font-semibold text-lg">Admin Audit Trail</h2>
            </div>
            <div className="p-4 space-y-1 text-sm">
                {logs.map(log => (
                    <div key={log.id} className="grid grid-cols-4 gap-4 p-1.5 rounded-lg hover:bg-slate-50">
                        <div className="text-gray-500 col-span-1">{new Date(log.created_at).toLocaleString()}</div>
                        <div className="font-mono text-xs col-span-1">
                            <span className="font-semibold text-gray-700">{log.actor.slice(0,8)}...</span>
                        </div>
                         <div className="col-span-2">
                            <span className="font-semibold">{log.action}</span> on <span className="font-mono text-xs bg-slate-100 p-1 rounded">{log.target}</span>
                        </div>
                    </div>
                ))}
                {!logs.length && <div className="text-gray-500 text-center py-6">No admin actions have been logged yet.</div>}
            </div>
        </div>
    );
};

export default AuditTrail;