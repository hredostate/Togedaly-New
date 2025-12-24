import React, { useState, useEffect, useCallback } from 'react';
import { getPublicIncidents, openIncident, updateIncident } from '../../../services/opsService';
import { useToasts } from '../../ToastHost';
import type { Incident, IncidentSeverity, IncidentStatus } from '../../../types';

const NewIncidentForm: React.FC<{ onIncidentOpened: () => void }> = ({ onIncidentOpened }) => {
    const [submitting, setSubmitting] = useState(false);
    const { add: addToast } = useToasts();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const body = formData.get('body') as string;
        const severity = formData.get('severity') as IncidentSeverity;

        if (!title || !body) {
            addToast({ title: 'Missing fields', desc: 'Title and initial note are required.', emoji: '📝'});
            return;
        }

        setSubmitting(true);
        try {
            await openIncident(title, body, severity);
            addToast({ title: 'Incident Opened', desc: 'The new incident has been created.', emoji: '✅' });
            (e.target as HTMLFormElement).reset();
            onIncidentOpened();
        } catch (err: any) {
            addToast({ title: 'Error', desc: err.message, emoji: '😥' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-3 space-y-2">
             <h3 className="font-semibold">Open New Incident</h3>
            <div className="flex flex-wrap gap-2">
                <input name="title" placeholder="Title" required className="border rounded-lg px-2 py-1.5 text-sm flex-grow" />
                <select name="severity" defaultValue="minor" className="border rounded-lg px-2 py-1.5 text-sm bg-white">
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div className="flex gap-2">
                <input name="body" placeholder="Initial note for the update feed" required className="border rounded-lg px-2 py-1.5 text-sm flex-grow" />
                <button type="submit" disabled={submitting} className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50">
                    {submitting ? 'Opening...' : 'Open'}
                </button>
            </div>
        </form>
    );
};


const Incidents: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
// FIX: Changed state type from string to number to match incident ID type.
    const [submitting, setSubmitting] = useState<number | null>(null);
    const { add: addToast } = useToasts();
    
    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPublicIncidents();
            setIncidents(data);
        } catch (e) {
            addToast({ title: 'Error', desc: 'Could not fetch incidents.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
// FIX: Convert form data string to number to match updateIncident signature.
        const id = Number(formData.get('id'));
        const body = formData.get('body') as string;
        const status = (formData.get('status') as IncidentStatus) || null;
        const resolve = formData.get('resolve') === 'on';
        
        if (!body && !status && !resolve) return;
        
        setSubmitting(id);
        try {
            await updateIncident(id, body, status, resolve);
            addToast({ title: 'Incident Updated', desc: 'Your update has been posted.', emoji: '✅' });
            fetchIncidents();
        } catch (err: any) {
             addToast({ title: 'Error', desc: err.message, emoji: '😥' });
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) return <div className="text-center p-4">Loading incidents...</div>;

    return (
        <div className="space-y-3">
            <NewIncidentForm onIncidentOpened={fetchIncidents} />
            {incidents.map(i => (
                <div key={i.id} className="rounded-2xl border p-4 bg-white">
                    <div className="flex justify-between text-sm">
                        <div className="font-semibold">{i.title}</div>
                        <div className="capitalize">{i.severity} • {i.status}</div>
                    </div>
                    <form onSubmit={handleUpdate} className="mt-2 flex flex-wrap gap-2 items-center">
                        <input type="hidden" name="id" value={i.id} />
                        <input name="body" placeholder="Post an update..." className="border rounded-lg px-2 py-1.5 text-sm flex-grow" />
                        <select name="status" defaultValue="" className="border rounded-lg px-2 py-1.5 text-sm bg-white">
                            <option value="">(no change)</option>
                            <option value="investigating">Investigating</option>
                            <option value="monitoring">Monitoring</option>
                            <option value="resolved">Resolved</option>
                        </select>
                        <label className="text-sm flex items-center gap-1">
                            <input type="checkbox" name="resolve" /> Resolve
                        </label>
{/* FIX: Comparison is now between number and number, resolving the unintentional comparison error. */}
                        <button type="submit" disabled={submitting === i.id} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-slate-100 disabled:opacity-50">Post</button>
                    </form>
                </div>
            ))}
        </div>
    );
};

export default Incidents;