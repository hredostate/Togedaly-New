
import React, { useState } from 'react';
import { createPool } from '../../services/poolService';
import { getSuggestedMilestones, parsePoolDetails } from '../../services/geminiService';
import { useToasts } from '../ToastHost';
import type { PoolType } from '../../types';

interface CreatePoolModalProps {
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({ onClose, onSuccess, userId }) => {
    const [step, setStep] = useState(0); // 0: Type, 1: Details, 2: Financials, 3: Milestones (Optional), 4: Members
    const [form, setForm] = useState({
        name: '',
        description: '',
        frequency: 'monthly' as 'weekly' | 'monthly',
        amount: '',
        type: 'ajo' as PoolType,
        inflation_shield: false
    });
    const [members, setMembers] = useState<string[]>([]);
    const [newMemberInput, setNewMemberInput] = useState('');
    const [milestones, setMilestones] = useState<{title: string, amount: number}[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isGeneratingMilestones, setIsGeneratingMilestones] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const { add: addToast } = useToasts();

    // Magic Paste Handler
    const handleMagicPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                addToast({ title: 'Clipboard Empty', desc: 'Copy your pool details first.', emoji: '📋' });
                return;
            }
            
            setIsParsing(true);
            const extracted = await parsePoolDetails(text);
            
            if (extracted && Object.keys(extracted).length > 0) {
                setForm(prev => ({
                    ...prev,
                    name: extracted.name || prev.name,
                    description: extracted.description || prev.description,
                    amount: extracted.amount ? String(extracted.amount) : prev.amount,
                    frequency: extracted.frequency || prev.frequency,
                    type: extracted.type || prev.type
                }));
                addToast({ title: 'Magic Paste!', desc: 'Form filled from your clipboard.', emoji: '✨' });
                if (extracted.type) setStep(1); // Advance if type detected
            } else {
                addToast({ title: 'Could not understand', desc: 'Try copying a clearer description.', emoji: '🤔' });
            }
        } catch (e) {
            addToast({ title: 'Error', desc: 'Could not access clipboard.', emoji: '🚫' });
        } finally {
            setIsParsing(false);
        }
    };

    const addMember = () => {
        if (newMemberInput && newMemberInput.includes('@') && !members.includes(newMemberInput)) {
            setMembers([...members, newMemberInput]);
            setNewMemberInput('');
        } else if (newMemberInput && !newMemberInput.includes('@')) {
            addToast({ title: 'Invalid Email', desc: 'Please enter a valid email address.', emoji: '⚠️' });
        }
    };

    const removeMember = (email: string) => {
        setMembers(members.filter(m => m !== email));
    };

    const handleGenerateMilestones = async () => {
        if (!form.name || !form.amount) return;
        setIsGeneratingMilestones(true);
        try {
            const suggestions = await getSuggestedMilestones(form.name, form.description, Number(form.amount));
            if (suggestions.length > 0) {
                setMilestones(suggestions);
                addToast({ title: 'Milestones Generated', desc: 'Review and adjust the suggested milestones.', emoji: '✨' });
            } else {
                addToast({ title: 'No Suggestions', desc: 'Could not generate milestones. Please add them manually.', emoji: '🤔' });
            }
        } catch (e) {
            addToast({ title: 'Error', desc: 'Failed to generate milestones.', emoji: '😥' });
        } finally {
            setIsGeneratingMilestones(false);
        }
    };

    const updateMilestone = (index: number, field: 'title' | 'amount', value: any) => {
        const newMilestones = [...milestones];
        newMilestones[index] = { ...newMilestones[index], [field]: value };
        setMilestones(newMilestones);
    };

    const addManualMilestone = () => {
        setMilestones([...milestones, { title: '', amount: 0 }]);
    };

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!form.name || !form.amount) return;
        
        setIsCreating(true);
        try {
            await createPool({
                name: form.name,
                description: form.description,
                frequency: form.frequency,
                amount_kobo: Number(form.amount) * 100,
                type: form.type,
                initialMembers: members,
                milestones: form.type !== 'ajo' ? milestones : undefined
            }, userId);
            
            const successMsg = form.type === 'ajo' ? 'Your new Ajo pool is ready.' 
                             : form.type === 'group_buy' ? 'Group Buy created successfully.' 
                             : 'Investment venture created.';
            
            addToast({ title: 'Success!', desc: successMsg, emoji: '🎉' });
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Failed to create pool.', emoji: '😥' });
            setIsCreating(false);
        }
    };

    const nextStep = () => {
        if (step === 2) {
            if (form.type === 'ajo') setStep(4);
            else setStep(3);
        } else {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step === 4) {
            if (form.type === 'ajo') setStep(2);
            else setStep(3);
        } else {
            setStep(step - 1);
        }
    };

    const typeDetails: Record<PoolType, { title: string, desc: string, icon: string, amountLabel: string }> = {
        ajo: { title: 'Ajo (Rotating Savings)', desc: 'Members contribute periodically; one takes the pot each cycle.', icon: '🔄', amountLabel: 'Contribution per Cycle' },
        invest: { title: 'Micro-Investments', desc: 'Pool funds for a venture (e.g. bus, land) and share returns.', icon: '📈', amountLabel: 'Target Amount' },
        group_buy: { title: 'Co-buy (Group Buy)', desc: 'Buy items in bulk to save costs (e.g. Rice, Cow Share).', icon: '🛍️', amountLabel: 'Target Amount' },
        event: { title: 'Event / Owambe', desc: 'Collect funds for tickets, aso-ebi, or parties.', icon: '🎉', amountLabel: 'Fundraising Goal' },
        waybill: { title: 'Waybill Escrow', desc: 'Secure funds until delivery is confirmed.', icon: '🚚', amountLabel: 'Item Value' },
    };

    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
    const targetAmount = Number(form.amount);
    const amountDiff = targetAmount - totalMilestoneAmount;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        {step === 0 ? 'Start a Pool' : `New ${typeDetails[form.type].title.split('(')[0]}`}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {step === 0 && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-600">Choose pool type:</p>
                                <button 
                                    onClick={handleMagicPaste}
                                    disabled={isParsing}
                                    className="text-xs flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-70 animate-pulse"
                                >
                                    {isParsing ? 'Reading...' : '✨ Magic Paste from Clipboard'}
                                </button>
                            </div>
                            
                            {(['ajo', 'invest', 'group_buy', 'event', 'waybill'] as PoolType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setForm({ ...form, type: t }); setStep(1); }}
                                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-brand hover:bg-brand-50/30 hover:shadow-md transition text-left flex gap-3 group"
                                >
                                    <div className="text-2xl">{typeDetails[t].icon}</div>
                                    <div>
                                        <div className="font-bold text-gray-800 group-hover:text-brand-700">{typeDetails[t].title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{typeDetails[t].desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleMagicPaste}
                                    disabled={isParsing}
                                    className="text-xs text-brand font-medium hover:underline flex items-center gap-1"
                                >
                                    <span>✨</span> {isParsing ? 'Filling...' : 'Auto-fill from clipboard'}
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input 
                                    autoFocus
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    placeholder={form.type === 'ajo' ? "e.g. Office Ajo 2024" : "e.g. Xmas Rice Share"}
                                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                    placeholder="What is this pool for? Who is it for?"
                                    rows={3}
                                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition resize-none"
                                />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition text-gray-600"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={nextStep} 
                                    disabled={!form.name}
                                    className="flex-[2] py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setForm({...form, frequency: 'weekly'})}
                                        className={`py-3 rounded-xl border font-medium transition ${form.frequency === 'weekly' ? 'bg-brand-50 border-brand text-brand-700 ring-1 ring-brand' : 'bg-white hover:bg-slate-50 text-gray-600'}`}
                                    >
                                        Weekly
                                    </button>
                                    <button 
                                        onClick={() => setForm({...form, frequency: 'monthly'})}
                                        className={`py-3 rounded-xl border font-medium transition ${form.frequency === 'monthly' ? 'bg-brand-50 border-brand text-brand-700 ring-1 ring-brand' : 'bg-white hover:bg-slate-50 text-gray-600'}`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{typeDetails[form.type].amountLabel} (₦)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                                    <input 
                                        type="number"
                                        value={form.amount} 
                                        onChange={e => setForm({...form, amount: e.target.value})} 
                                        placeholder="e.g. 20000"
                                        className="w-full border rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition font-mono text-lg"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {form.type === 'ajo' ? `Each member pays this amount ${form.frequency}.` : 
                                     form.type === 'group_buy' ? 'Total target amount for the bulk purchase.' : 
                                     'Total target investment amount.'}
                                </p>
                            </div>

                            {form.type === 'ajo' && (
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={form.inflation_shield}
                                            onChange={(e) => setForm({...form, inflation_shield: e.target.checked})}
                                            className="h-5 w-5 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="font-semibold text-emerald-800 text-sm">🛡️ Inflation Shield</div>
                                            <div className="text-xs text-emerald-700">Auto-swap contributions to USDC to protect value against devaluation.</div>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition text-gray-600"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={nextStep} 
                                    disabled={!form.amount}
                                    className="flex-[2] py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand/20 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Project Milestones</label>
                                <button 
                                    onClick={handleGenerateMilestones}
                                    disabled={isGeneratingMilestones}
                                    className="text-xs flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition disabled:opacity-70"
                                >
                                    {isGeneratingMilestones ? 'Generating...' : '✨ Suggest with AI'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                Define key phases for releasing funds. Investors will vote to approve each milestone.
                            </p>

                            <div className="space-y-3">
                                {milestones.map((m, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <input 
                                                value={m.title}
                                                onChange={e => updateMilestone(idx, 'title', e.target.value)}
                                                placeholder="Phase Name"
                                                className="col-span-2 border rounded-lg px-2 py-2 text-sm"
                                            />
                                            <input 
                                                type="number"
                                                value={m.amount}
                                                onChange={e => updateMilestone(idx, 'amount', Number(e.target.value))}
                                                placeholder="Amount"
                                                className="border rounded-lg px-2 py-2 text-sm"
                                            />
                                        </div>
                                        <button onClick={() => removeMilestone(idx)} className="text-gray-400 hover:text-rose-500">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addManualMilestone} className="text-sm text-brand font-medium hover:underline">+ Add Milestone</button>
                            </div>

                            <div className={`p-3 rounded-xl text-xs flex justify-between items-center ${Math.abs(amountDiff) > 100 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                                <span>Total: ₦{totalMilestoneAmount.toLocaleString()}</span>
                                <span>Target: ₦{targetAmount.toLocaleString()}</span>
                            </div>
                            {Math.abs(amountDiff) > 100 && (
                                <div className="text-xs text-amber-600">
                                    Milestone total doesn't match target amount (Diff: ₦{amountDiff.toLocaleString()}).
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition text-gray-600"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={nextStep} 
                                    disabled={Math.abs(amountDiff) > (targetAmount * 0.05)} // Allow 5% variance? Or strict? Let's say lenient for demo
                                    title={Math.abs(amountDiff) > (targetAmount * 0.05) ? "Amounts must match target" : ""}
                                    className="flex-[2] py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    Next: Add Members
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Invite Members (Optional)</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={newMemberInput}
                                        onChange={e => setNewMemberInput(e.target.value)}
                                        placeholder="Enter email address"
                                        className="flex-1 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                        onKeyDown={e => e.key === 'Enter' && addMember()}
                                    />
                                    <button 
                                        onClick={addMember} 
                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                                {members.map(m => (
                                    <div key={m} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm animate-fade-in">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {m.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-slate-700">{m}</span>
                                        </div>
                                        <button onClick={() => removeMember(m)} className="text-gray-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {members.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-sm text-gray-500">No members added yet.</p>
                                        <p className="text-xs text-gray-400 mt-1">You can always invite more people later.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition text-gray-600"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isCreating}
                                    className="flex-[2] py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand/20 disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : `Create Pool ${members.length > 0 ? `(${members.length + 1} members)` : ''}`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePoolModal;
