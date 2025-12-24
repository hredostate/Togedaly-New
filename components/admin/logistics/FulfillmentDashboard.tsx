
import React, { useState, useEffect, useCallback } from 'react';
import { getFulfillmentOrders, updateFulfillmentStatus } from '../../../services/supplierService';
import type { GroupBuy, FulfillmentStatus } from '../../../types';
import { useToasts } from '../../ToastHost';
import ProofOfDeliveryModal from './ProofOfDeliveryModal';

const statusColors: Record<FulfillmentStatus | string, string> = {
    pending: 'bg-slate-100 text-slate-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-amber-100 text-amber-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    issue: 'bg-rose-100 text-rose-700',
};

const FulfillmentDashboard: React.FC = () => {
    const [orders, setOrders] = useState<GroupBuy[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingPodId, setUploadingPodId] = useState<number | null>(null);
    const { add: addToast } = useToasts();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getFulfillmentOrders();
            setOrders(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load orders.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadData() }, [loadData]);

    const handleStatusUpdate = async (id: number, status: FulfillmentStatus) => {
        try {
            await updateFulfillmentStatus(id, status);
            addToast({ title: 'Status Updated', desc: `Order marked as ${status}.`, emoji: '🚚' });
            loadData();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Active Fulfillments</h2>
            <div className="rounded-2xl border bg-white overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-3 text-left">GroupBuy</th>
                            <th className="p-3 text-left">Units</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">POD</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading fulfillments...</td></tr>
                        ) : orders.map(o => {
                            const status = o.fulfillment_status || 'pending';
                            const filled = o.units_fulfilled || 0;
                            const total = o.total_reserved_units || 0;
                            return (
                                <tr key={o.id} className="border-b">
                                    <td className="p-3 font-medium">
                                        {o.name}
                                        <div className="text-xs text-gray-500">ID: {o.id}</div>
                                    </td>
                                    <td className="p-3">
                                        {filled} / {total}
                                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min((filled/total)*100, 100)}%` }}></div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[status] || 'bg-gray-100'}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {o.pod_url ? (
                                            <a href={o.pod_url} target="_blank" rel="noreferrer" className="text-xs text-brand underline">View POD</a>
                                        ) : (
                                            <button onClick={() => setUploadingPodId(o.id)} className="text-xs text-gray-500 underline hover:text-gray-800">Upload</button>
                                        )}
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        {status !== 'delivered' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(o.id, 'shipped')} className="px-2 py-1 text-xs border rounded hover:bg-slate-50">Mark Shipped</button>
                                                <button onClick={() => setUploadingPodId(o.id)} className="px-2 py-1 text-xs bg-slate-900 text-white rounded hover:bg-slate-700">Delivered</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && orders.length === 0 && (
                            <tr><td colSpan={5} className="p-6 text-center text-gray-500">No active orders to fulfill.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {uploadingPodId && (
                <ProofOfDeliveryModal 
                    groupBuyId={uploadingPodId} 
                    onClose={() => setUploadingPodId(null)} 
                    onSuccess={() => { setUploadingPodId(null); loadData(); }} 
                />
            )}
        </div>
    );
};

export default FulfillmentDashboard;
