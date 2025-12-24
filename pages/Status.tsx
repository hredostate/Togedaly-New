
import React from 'react';
import StatusFeed from '../components/status/StatusFeed';
import type { Page } from '../App';

// Re-using the Page type if needed, though this component doesn't use props currently
const Status: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-slate-900 text-white py-12 mb-8 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live System Status
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">System Operational</h1>
          <p className="text-slate-400 max-w-lg mx-auto">Real-time uptime monitoring and incident history for all Togedaly services.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <StatusFeed />
        </div>
      </div>
    </div>
  );
};

export default Status;
