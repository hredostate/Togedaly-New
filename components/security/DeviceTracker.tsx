import React, { useEffect, useState } from 'react';
import { getDeviceHistory } from '../../services/kycService';
import type { DeviceEvent } from '../../types';

const DeviceTracker: React.FC = () => {
  const [rows, setRows] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeviceHistory().then(data => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <h3 className="font-semibold mb-2">Recent Login Activity</h3>
      {loading ? (
        <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          {rows.map((row) => (
            <div key={row.id} className="flex justify-between p-2 rounded-lg hover:bg-slate-50">
              <div>
                <span className="font-medium text-gray-800">Device ID: {row.device_hash.slice(0, 12)}...</span>
                <span className="text-gray-500 block text-xs">IP: {row.ip} • {row.city}, {row.country}</span>
              </div>
              <div className="text-gray-500 text-xs text-right">
                {new Date(row.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-gray-500 text-sm text-center py-4">No recent activity found.</div>}
        </div>
      )}
    </div>
  );
};

export default DeviceTracker;