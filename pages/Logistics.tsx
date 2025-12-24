
import React from 'react';
import type { Page } from '../App';
import FulfillmentDashboard from '../components/admin/logistics/FulfillmentDashboard';

const Logistics: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold">Logistics & Fulfillment</h1>
            <p className="text-sm text-gray-500">Track supplier deliveries, order status, and proof of delivery.</p>
        </div>
        <button onClick={() => setPage('suppliers')} className="px-4 py-2 text-sm rounded-xl border hover:bg-slate-50">
            Manage Suppliers
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border shadow-sm">
            <div className="text-sm text-gray-500">Pending Deliveries</div>
            <div className="text-2xl font-bold">3</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border shadow-sm">
            <div className="text-sm text-gray-500">Avg Lead Time</div>
            <div className="text-2xl font-bold">3.2 Days</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border shadow-sm">
            <div className="text-sm text-gray-500">Fulfillment Rate</div>
            <div className="text-2xl font-bold text-emerald-600">98%</div>
        </div>
      </div>

      <FulfillmentDashboard />
    </div>
  );
};

export default Logistics;
