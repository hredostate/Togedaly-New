import React, { useState } from 'react';

const goLiveItems = [
    "PITR enabled, retention set",
    "Nightly export function working",
    "Off‑site copy weekly",
    "Load tests green at target",
    "CDN cache headers verified",
    "Queue autoscaling policy applied",
];

const monthlyItems = [
    "DR restore drill executed",
    "Backup integrity spot‑check",
    "Index/EXPLAIN review on slowest queries",
];

const ChecklistItem: React.FC<{ label: string }> = ({ label }) => {
    const [isChecked, setIsChecked] = useState(false);

    return (
        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <input
                type="checkbox"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className={`text-sm ${isChecked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                {label}
            </span>
        </label>
    );
};

const Checklists: React.FC = () => {
    return (
        <div className="space-y-4">
            <h2 className="font-semibold text-lg">Operational Checklists</h2>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <h3 className="font-semibold mb-2">Go-Live Checklist</h3>
                    <div className="space-y-1">
                        {goLiveItems.map((item, index) => (
                            <ChecklistItem key={index} label={item} />
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <h3 className="font-semibold mb-2">Monthly Checklist</h3>
                     <div className="space-y-1">
                        {monthlyItems.map((item, index) => (
                            <ChecklistItem key={index} label={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checklists;
