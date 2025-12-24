
import React, { useState, useEffect, useCallback } from 'react';
import { getRiskEvents, resolveRiskEvent } from '../../services/adminService';
import type { AdminRiskEvent } from '../../types';
import { useToasts } from '../ToastHost';
import RiskOverview from './RiskOverview';

const severityClasses: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-rose-100 text-rose-800',
    critical: 'bg-red-200 text-red-900 font-bold',
};

const RiskEventsList: React.FC = () => {
    const [events, setEvents] = useState<AdminRiskEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const { add: addToast } = useToasts();

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRiskEvents();
            setEvents(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not fetch risk events.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const handleResolve = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const eventId = formData.get('event_id') as string;
        const note = formData.get('note') as string;
        
        setSubmitting(eventId);
        try {
            await resolveRiskEvent(eventId, note);
            addToast({ title: 'Risk Resolved', desc: 'Event has been marked as handled.', emoji: '✅' });
            fetchEvents();
        } catch (e: any) {
             addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) return <div className="text-center p-4">Loading risk events...</div>;

    return (
        <div className="space-y-3 animate-fade-in">
            {events.map(e => (
                <div key={e.id} className="rounded-2xl border p-4 bg-white">
                    <div className="flex justify-between items-start text-sm">
                        <div className="font-medium">{e.code.replace('_', ' ')}</div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityClasses[e.severity]}`}>{e.severity}</span>
                    </div>
                    <div className="text-xs text-gray-500">{e.source} • user {e.user_id.slice(0,8)}... • {new Date(e.created_at).toLocaleString()}</div>
                    <form onSubmit={handleResolve} className="mt-3 flex gap-2">
                        <input type="hidden" name="event_id" value={e.id} />
                        <input name="note" placeholder="Resolution note..." className="flex-grow border rounded-lg px-2 py-1.5 text-sm focus:ring-brand focus:border-brand" />
                        <button type="submit" disabled={submitting === e.id} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-slate-100 disabled:opacity-50">Mark Resolved</button>
                    </form>
                </div>
            ))}
            {!events.length && <div className="text-gray-500 rounded-2xl border border-dashed p-6 text-center">No outstanding risk events. The platform is looking healthy!</div>}
        </div>
    );
};

const RiskDashboard: React.FC = () => {
    const [tab, setTab] = useState<'events' | 'profiles'>('events');

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">Risk Dashboard</h2>
                <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-medium">
                    <button 
                        onClick={() => setTab('events')} 
                        className={`px-4 py-2 rounded-lg transition ${tab === 'events' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Active Alerts
                    </button>
                    <button 
                        onClick={() => setTab('profiles')} 
                        className={`px-4 py-2 rounded-lg transition ${tab === 'profiles' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        User Profiles
                    </button>
                </div>
            </div>
            
            {tab === 'events' ? <RiskEventsList /> : <RiskOverview />}
        </div>
    );
};

export default RiskDashboard;
