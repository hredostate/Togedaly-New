import React, { useState } from 'react';
import type { Dispute, DisputeStatus } from '../../types';
import { updateAdminDispute } from '../../services/standingService';
import { useToasts } from '../ToastHost';
import ReputationCard from '../ReputationCard';
import CommentComposer from '../CommentComposer';


interface DisputeDrawerProps {
    dispute: Dispute | null;
    onClose: () => void;
    onUpdate: () => void;
}

const DisputeDrawer: React.FC<DisputeDrawerProps> = ({ dispute, onClose, onUpdate }) => {
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<DisputeStatus | null>(null);
    const { add: addToast } = useToasts();
    
    if (!dispute) return null;

    const handleUpdate = async () => {
        if (!status) {
            addToast({ title: 'Status required', desc: 'Please select a new status.', emoji: '📝' });
            return;
        }
        try {
            await updateAdminDispute(dispute.id, { status, admin_note: note });
            addToast({ title: 'Dispute Updated', desc: 'The dispute has been updated.', emoji: '✅' });
            onUpdate();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        }
    };
    
    return (
        <div className={`fixed inset-0 z-50 flex justify-end bg-black/30 transition-opacity ${dispute ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Dispute Details</h2>
                    <button onClick={onClose}>&times;</button>
                </div>
                
                <div className="p-3 rounded-xl bg-slate-50 border">
                    <div className="font-bold">{dispute.title}</div>
                    <div className="text-xs text-gray-500">ID: {dispute.id} • Kind: {dispute.kind}</div>
                    <p className="text-sm mt-2">{dispute.body}</p>
                </div>
                
                <ReputationCard orgId={dispute.org_id} userId={dispute.user_id} />

                <div>
                    <h3 className="font-semibold mb-1">Update Status</h3>
                    <select onChange={e => setStatus(e.target.value as DisputeStatus)} defaultValue="" className="w-full border p-2 rounded-xl bg-white">
                        <option value="" disabled>Select new status</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                
                <div>
                    <h3 className="font-semibold mb-1">Internal Note</h3>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="w-full border p-2 rounded-xl" placeholder="Add a note for the audit log..."/>
                </div>

                <CommentComposer 
                    orgId={dispute.org_id}
                    target={`dispute:${dispute.id}`}
                    author="admin" // In real app, from session
                />
                
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 rounded-xl border">Cancel</button>
                    <button onClick={handleUpdate} disabled={!status} className="px-3 py-2 rounded-xl bg-brand text-white disabled:opacity-50">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default DisputeDrawer;
