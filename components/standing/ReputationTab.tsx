
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '../../supabaseClient';
import { getUserReputation } from '../../services/reputationService';
import type { UserReputation } from '../../types';

const ReputationTab: React.FC = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const { data: reputation, isLoading: loading } = useSWR<UserReputation | null>(
        user ? ['user-reputation', 1, user.id] : null,
        ([_, orgId, userId]) => getUserReputation(orgId as number, userId as string)
    );

    if (!user) return <div>Loading user information...</div>;
    if (loading) return <div>Loading reputation...</div>;
    if (!reputation) return <div>Could not load reputation data.</div>;

    return (
        <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-lg">Your Reputation Breakdown</h3>
            <div className="grid grid-cols-2 gap-4 mt-2 text-center">
                <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold">{reputation.trust_score}</div>
                    <div className="text-sm text-gray-500">Overall Trust Score</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-600">+{reputation.score_on_time}</div>
                    <div className="text-sm text-gray-500">On-Time Payments</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-rose-600">{reputation.score_misses}</div>
                    <div className="text-sm text-gray-500">Missed Payments</div>
                </div>
                 <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">+{reputation.score_peer}</div>
                    <div className="text-sm text-gray-500">Peer Feedback</div>
                </div>
            </div>
        </div>
    );
};

export default ReputationTab;
