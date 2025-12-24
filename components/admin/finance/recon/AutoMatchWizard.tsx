
import React, { useState, useEffect } from 'react';
import { getAutoMatchSuggestions, confirmMatch, MatchSuggestion } from '../../../../services/reconService';
import { useToasts } from '../../../ToastHost';

interface AutoMatchWizardProps {
    runId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const AutoMatchWizard: React.FC<AutoMatchWizardProps> = ({ runId, onClose, onSuccess }) => {
    const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [confirming, setConfirming] = useState(false);
    const { add: addToast } = useToasts();

    useEffect(() => {
        getAutoMatchSuggestions(runId)
            .then(data => {
                setSuggestions(data);
                // Select high confidence matches by default
                const highConf = data.filter(s => s.confidence > 0.8).map(s => s.id);
                setSelectedIds(new Set(highConf));
                setLoading(false);
            })
            .catch(() => {
                addToast({ title: 'Error', desc: 'Could not generate suggestions.', emoji: '😥' });
                setLoading(false);
            });
    }, [runId, addToast]);

    const toggleSuggestion = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleConfirm = async () => {
        if (selectedIds.size === 0) return;
        setConfirming(true);
        try {
            const itemIdsToMatch: number[] = [];
            suggestions.forEach(s => {
                if (selectedIds.has(s.id)) {
                    s.items.forEach(i => itemIdsToMatch.push(i.id));
                }
            });
            
            await confirmMatch(itemIdsToMatch);
            addToast({ title: 'Matched!', desc: `${selectedIds.size} groups successfully reconciled.`, emoji: '🔗' });
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Auto-Match Suggestions</h3>
                    <div className="text-sm text-gray-500">{suggestions.length} suggestions found</div>
                </div>

                <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50 p-2 space-y-2">
                    {loading && <div className="text-center p-8 text-gray-500">Analyzing transactions...</div>}
                    
                    {!loading && suggestions.map(s => (
                        <div key={s.id} className={`p-3 rounded-xl border bg-white transition-all cursor-pointer ${selectedIds.has(s.id) ? 'ring-2 ring-brand border-transparent' : 'hover:border-brand-300'}`} onClick={() => toggleSuggestion(s.id)}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={selectedIds.has(s.id)} readOnly className="rounded text-brand focus:ring-brand" />
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.confidence > 0.8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {Math.round(s.confidence * 100)}% Match
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">{s.reason}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {s.items.map(item => (
                                    <div key={item.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex justify-between">
                                            <span className="uppercase text-xs font-bold text-gray-500">{item.source}</span>
                                            <span className="font-mono text-xs text-gray-400">{item.external_ref}</span>
                                        </div>
                                        <div className={`font-semibold mt-1 ${item.amount < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                            ₦{(item.amount / 100).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {!loading && suggestions.length === 0 && (
                        <div className="text-center p-8 text-gray-500">No obvious matches found.</div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleConfirm} disabled={confirming || selectedIds.size === 0} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {confirming ? 'Matching...' : `Confirm ${selectedIds.size} Matches`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutoMatchWizard;
