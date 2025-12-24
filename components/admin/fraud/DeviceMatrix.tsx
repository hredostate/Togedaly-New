import React, { useState, useEffect, useCallback } from 'react';
import { getDeviceMatrix } from '../../../services/fraudService';
// FIX: Renamed imported type 'DeviceMatrix' to 'DeviceMatrixType' to resolve name collision with the component.
import type { DeviceMatrix as DeviceMatrixType } from '../../../types';
import { useToasts } from '../../ToastHost';

const DeviceMatrix: React.FC = () => {
    const [matrix, setMatrix] = useState<DeviceMatrixType[]>([]);
    const [loading, setLoading] = useState(true);
    const { add: addToast } = useToasts();

    const loadMatrix = useCallback(async () => {
        setLoading(true);
        try {
            setMatrix(await getDeviceMatrix());
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load device matrix.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadMatrix();
    }, [loadMatrix]);
    
    const suspiciousDevices = matrix.filter(d => d.user_ids.length > 1);

    if (loading) return <div className="text-center p-4">Loading device matrix...</div>;

    return (
        <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-lg">Suspicious Devices</h3>
            <p className="text-xs text-gray-500 mb-2">Showing devices linked to more than one user account.</p>
            <div className="rounded-xl overflow-auto border">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                        <tr>
                            <th className="p-2">Fingerprint</th>
                            <th className="p-2">Users ({suspiciousDevices.reduce((sum, d) => sum + d.user_ids.length, 0)})</th>
                            <th className="p-2">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suspiciousDevices.map(device => (
                            <tr key={device.fingerprint} className="border-t">
                                <td className="p-2 font-mono text-xs">{device.fingerprint}</td>
                                <td className="p-2">
                                    <div className="flex flex-wrap gap-1">
                                        {device.user_ids.map(uid => <span key={uid} className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-mono">{uid}</span>)}
                                    </div>
                                </td>
                                <td className="p-2 text-xs">{new Date(device.last_seen).toLocaleString()}</td>
                            </tr>
                        ))}
                         {suspiciousDevices.length === 0 && (
                            <tr><td colSpan={3} className="text-center p-6 text-gray-500">No suspicious device links found.</td></tr>
                         )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeviceMatrix;