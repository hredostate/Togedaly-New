
import React, { useState, useEffect, useCallback } from 'react';
import { getAvailablePlans, getOrgSubscription, updateOrgSubscription, applyPromoCode, claimReferralCode, getOrgCredits, upsertBillingPlan, deleteBillingPlan, getGlobalPromos, upsertGlobalPromo } from '../../services/billingService';
import type { BillingPlan, OrgSubscription, OrgCredit, PromoCode } from '../../types';
import { useToasts } from '../ToastHost';
import { supabase } from '../../supabaseClient';

const MOCK_ORG_ID = 1;

const MOCK_USAGE = {
    pools_joined: 2,
    active_loans: 0
};

const PlanCard: React.FC<{
    plan: BillingPlan;
    currentPlanId?: number;
    currentPlanFee?: number;
    onSelect: (planId: number) => void;
    isSaving: boolean;
    isAdminMode?: boolean;
    onEdit?: (plan: BillingPlan) => void;
    onDelete?: (planId: number) => void;
}> = ({ plan, currentPlanId, currentPlanFee, onSelect, isSaving, isAdminMode, onEdit, onDelete }) => {
    const isCurrent = plan.id === currentPlanId;
    const isUpgrade = !isCurrent && plan.monthly_fee > (currentPlanFee || 0);

    return (
        <div className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 ${
            isCurrent 
                ? 'bg-slate-900 text-white shadow-xl ring-4 ring-slate-200 scale-105 z-10' 
                : 'bg-white border border-slate-200 hover:border-brand-300 hover:shadow-lg'
        }`}>
            {isCurrent && !isAdminMode && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                    Current Tier
                </div>
            )}
            
            <div className="mb-4">
                <h3 className={`text-lg font-bold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-3xl font-extrabold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                        {plan.monthly_fee > 0 ? `₦${(plan.monthly_fee).toLocaleString()}` : 'Free'}
                    </span>
                    {plan.monthly_fee > 0 && <span className={`text-sm ${isCurrent ? 'text-slate-400' : 'text-gray-500'}`}>/mo</span>}
                </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm">
                    <span className="text-emerald-400">✓</span>
                    <span className={isCurrent ? 'text-slate-300' : 'text-gray-600'}>
                        {plan.max_pools && plan.max_pools < 999 ? <strong>Join up to {plan.max_pools} Pools</strong> : <strong>Unlimited Pools</strong>}
                    </span>
                </li>
                {/* Enforced for all plans */}
                <li className="flex items-start gap-3 text-sm">
                    <span className="text-emerald-400">✓</span>
                    <span className={isCurrent ? 'text-slate-300' : 'text-gray-600'}>
                        <strong>AI Nudge Engine (Included)</strong>
                    </span>
                </li>
                {plan.features.priority_support && (
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-emerald-400">✓</span>
                        <span className={isCurrent ? 'text-slate-300' : 'text-gray-600'}>Priority Support</span>
                    </li>
                )}
                {plan.features.custom_branding && (
                    <li className="flex items-start gap-3 text-sm">
                        <span className="text-emerald-400">✓</span>
                        <span className={isCurrent ? 'text-slate-300' : 'text-gray-600'}>Odogwu Badge & Perks</span>
                    </li>
                )}
            </ul>

            {isAdminMode ? (
                <div className="flex gap-2">
                    <button onClick={() => onEdit?.(plan)} className="flex-1 py-2 rounded-xl text-sm font-semibold border bg-white text-gray-800 hover:bg-slate-50">Edit</button>
                    <button onClick={() => onDelete?.(plan.id)} className="px-3 py-2 rounded-xl text-sm font-semibold border bg-white text-rose-600 hover:bg-rose-50">🗑️</button>
                </div>
            ) : (
                <button
                    onClick={() => onSelect(plan.id)}
                    disabled={isCurrent || isSaving}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                        isCurrent 
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                            : isUpgrade
                                ? 'bg-brand text-white hover:bg-brand-700 shadow-lg shadow-brand/20'
                                : 'bg-white border-2 border-slate-200 text-gray-600 hover:border-gray-400'
                    }`}
                >
                    {isCurrent ? 'Active' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                </button>
            )}
        </div>
    );
};

const PlanEditorModal: React.FC<{ plan: Partial<BillingPlan>, onClose: () => void, onSave: (p: Partial<BillingPlan>) => void }> = ({ plan, onClose, onSave }) => {
    const [form, setForm] = useState(plan);
    
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg">{plan.id ? 'Edit Tier' : 'Create Tier'}</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-500">Tier Name</label>
                    <input className="w-full border rounded-xl px-3 py-2 mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Monthly Fee (₦)</label>
                        <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1" value={form.monthly_fee} onChange={e => setForm({...form, monthly_fee: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Max Active Pools</label>
                        <input type="number" className="w-full border rounded-xl px-3 py-2 mt-1" value={form.max_pools || 0} onChange={e => setForm({...form, max_pools: Number(e.target.value)})} />
                    </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-not-allowed">
                        <input type="checkbox" checked={true} disabled /> AI Nudges (Mandatory)
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
                        <input type="checkbox" checked={!!form.features?.priority_support} onChange={e => setForm({...form, features: {...form.features, priority_support: e.target.checked, ai_nudges: true} as any})} /> 
                        Priority Support
                    </label>
                    <label className="flex items-center gap-2 text-sm mt-2">
                        <input type="checkbox" checked={!!form.features?.custom_branding} onChange={e => setForm({...form, features: {...form.features, custom_branding: e.target.checked, ai_nudges: true} as any})} /> 
                        VIP Badge / Branding
                    </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Save Tier</button>
                </div>
            </div>
        </div>
    );
};

const Billing: React.FC = () => {
    const [viewMode, setViewMode] = useState<'subscribe' | 'manage'>('subscribe');
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [subscription, setSubscription] = useState<{ subscription: OrgSubscription | null, plan: BillingPlan | null } | null>(null);
    const [credits, setCredits] = useState<OrgCredit[]>([]);
    const [promos, setPromos] = useState<PromoCode[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [actorId, setActorId] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [editingPlan, setEditingPlan] = useState<Partial<BillingPlan> | null>(null);
    const [newPromo, setNewPromo] = useState<Partial<PromoCode> | null>(null);

    const { add: addToast } = useToasts();
    
    useEffect(() => {
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => {
            if (user) setActorId(user.id);
        });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [plansData, subData, creditsData, promosData] = await Promise.all([
                getAvailablePlans(),
                getOrgSubscription(MOCK_ORG_ID),
                getOrgCredits(MOCK_ORG_ID),
                getGlobalPromos()
            ]);
            setPlans(plansData);
            setSubscription(subData);
            setCredits(creditsData);
            setPromos(promosData);
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadData(); }, [loadData]);
    
    const handlePlanSelect = async (newPlanId: number) => {
        if (!actorId) return;
        if (!confirm('Change membership tier?')) return;
        setIsSaving(true);
        try {
            await updateOrgSubscription(MOCK_ORG_ID, newPlanId, actorId);
            addToast({ title: 'Membership Updated', desc: 'Your tier has been changed.', emoji: '✅' });
            loadData();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePlan = async (plan: Partial<BillingPlan>) => {
        try {
            await upsertBillingPlan(plan);
            addToast({ title: 'Saved', desc: 'Membership Tier updated.', emoji: '💾' });
            setEditingPlan(null);
            loadData();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!confirm('Delete this tier definition?')) return;
        try {
            await deleteBillingPlan(id);
            addToast({ title: 'Deleted', desc: 'Tier removed.', emoji: '🗑️' });
            loadData();
        } catch(e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">Loading...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{viewMode === 'manage' ? 'Manage Membership Tiers' : 'My Membership'}</h2>
                <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-medium">
                    <button 
                        onClick={() => setViewMode('subscribe')} 
                        className={`px-4 py-2 rounded-lg transition ${viewMode === 'subscribe' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                        My Membership
                    </button>
                    <button 
                        onClick={() => setViewMode('manage')} 
                        className={`px-4 py-2 rounded-lg transition ${viewMode === 'manage' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >
                        Manage Tiers
                    </button>
                </div>
            </div>

            {viewMode === 'subscribe' ? (
                <>
                    <div className="grid md:grid-cols-3 gap-6 items-start">
                        {plans.map(plan => (
                            <PlanCard 
                                key={plan.id} 
                                plan={plan} 
                                currentPlanId={subscription?.subscription?.plan_id} 
                                currentPlanFee={subscription?.plan?.monthly_fee} 
                                onSelect={handlePlanSelect} 
                                isSaving={isSaving} 
                            />
                        ))}
                    </div>
                    
                    <div className="rounded-3xl bg-white border p-6 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Redeem Code</h3>
                            <p className="text-sm text-gray-500">Got a promo code or referral?</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO CODE" className="border rounded-xl px-4 py-2 text-sm uppercase flex-1" />
                            <button onClick={async () => { await applyPromoCode(MOCK_ORG_ID, promoCode); loadData(); }} className="px-4 py-2 text-sm font-bold rounded-xl bg-slate-900 text-white">Apply</button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-6 items-start">
                        {plans.map(plan => (
                            <PlanCard 
                                key={plan.id} 
                                plan={plan} 
                                isAdminMode={true} 
                                onSelect={() => {}} 
                                isSaving={false} 
                                onEdit={setEditingPlan} 
                                onDelete={handleDeletePlan} 
                            />
                        ))}
                        <button onClick={() => setEditingPlan({ features: { ai_nudges: true, priority_support: false } })} className="h-64 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 transition">
                            <span className="text-4xl mb-2">+</span>
                            <span className="font-semibold">Create New Tier</span>
                        </button>
                    </div>
                </div>
            )}

            {editingPlan && <PlanEditorModal plan={editingPlan} onClose={() => setEditingPlan(null)} onSave={handleSavePlan} />}
        </div>
    );
};

export default Billing;
