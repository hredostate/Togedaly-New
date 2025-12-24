import React, { useEffect, useState } from 'react';
import { getPublicIncidents, getUptimeChecks } from '../../services/opsService';
import type { Incident, UptimeCheck } from '../../types';

const StatusFeed: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [checks, setChecks] = useState<UptimeCheck[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [inc, chk] = await Promise.all([getPublicIncidents(), getUptimeChecks()]);
                setIncidents(inc);
                setChecks(chk);
            } catch (e) {
                console.error("Failed to load status data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const recentChecks = checks.slice(0, 5);
    const overallOk = recentChecks.length > 0 && recentChecks.every(c => c.ok);
    const overallStatus = overallOk ? 'All systems operational' : 'Degraded performance';
    const statusColor = overallOk ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-amber-100 border-amber-200 text-amber-800';

    const severityClasses: Record<string, string> = {
        minor: 'bg-amber-100 text-amber-800',
        major: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800',
    };

    const statusClasses: Record<string, string> = {
        investigating: 'text-amber-600',
        monitoring: 'text-blue-600',
        resolved: 'text-emerald-600',
        false_positive: 'text-slate-600',
    };

    if (loading) return <div className="text-center p-8">Loading status...</div>;

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border p-4 text-center font-semibold ${statusColor}`}>
                {overallStatus}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Incidents</h2>
                {incidents.map(i => (
                    <div key={i.id} className="rounded-2xl border bg-white p-4">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-lg">{i.title}</h3>
                             <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${severityClasses[i.severity]}`}>{i.severity}</span>
                        </div>
                         <div className={`text-sm font-medium capitalize mb-2 ${statusClasses[i.status]}`}>{i.status}</div>
                        <div className="space-y-3">
                            {i.updates.map(u => (
                                <div key={u.id} className="text-sm text-gray-700 border-l-2 pl-3">
                                    <div className="text-gray-500 text-xs font-semibold mb-0.5">{new Date(u.created_at).toLocaleString()}</div>
                                    <div className="whitespace-pre-wrap">{u.body_md}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {incidents.length === 0 && <div className="text-sm text-gray-500 text-center p-6 border rounded-2xl">No active incidents.</div>}
            </div>
        </div>
    );
};

export default StatusFeed;