
import React from 'react';
import useSWR from 'swr';
import { getUserDefaultEvents } from '../../services/standingService';
import type { DefaultEvent } from '../../types';

const DefaultEventsTab: React.FC = () => {
    const { data: events, isLoading: loading } = useSWR<DefaultEvent[]>('my-defaults', getUserDefaultEvents);

    return (
        <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-lg">Default History</h3>
            <div className="mt-2 space-y-2">
                {loading && <p>Loading history...</p>}
                {!loading && events?.map(e => (
                    <div key={e.id} className="p-2 border-b">
                        <div className="font-medium">Pool: {e.pool_id.slice(0, 8)}... - State: {e.state}</div>
                        <div className="text-xs text-gray-500">Penalty: ₦{(e.penalty_amount / 100).toLocaleString()} - {new Date(e.created_at).toLocaleDateString()}</div>
                    </div>
                ))}
                {!loading && events?.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No default events on record. Keep it up!</p>}
            </div>
        </div>
    );
};

export default DefaultEventsTab;
