
import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../App';
import type { GroupBuy, GroupBuyStatus } from '../types';
import { getGroupBuys, upsertGroupBuy } from '../services/groupbuyService';
import { useToasts } from '../components/ToastHost';

const statusOptions: GroupBuyStatus[] = ['draft', 'prelaunch', 'open', 'closing', 'locked', 'fulfilling', 'completed', 'cancelled', 'partially_refunded'];

const statusColors: Record<GroupBuyStatus, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    prelaunch: 'bg-sky-100 text-sky-700 border-sky-200',
    open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    closing: 'bg-amber-100 text-amber-700 border-amber-200',
    locked: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    fulfilling: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
    partially_refunded: 'bg-orange-100 text-orange-700 border-orange-200',
};

const GroupBuyEditor: React.FC<{
    groupBuy: Partial<GroupBuy>;
    onSave: (groupBuy: Partial<GroupBuy>) => void;
    onCancel: () => void;
    isSaving: boolean;
}> = ({ groupBuy, onSave, onCancel, isSaving }) => {
    const [form, setForm] = useState(groupBuy);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setForm(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">{groupBuy.id ? 'Edit GroupBuy' : 'Create New GroupBuy'}</h3>
                
                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium">Name</label>
                            <input name="name" value={form.name || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                         <div>
                            <label className="font-medium">Status</label>
                            <select name="status" value={form.status || 'draft'} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2 bg-white capitalize">
                                {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="font-medium">Description</label>
                        <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} className="w-full mt-1 border rounded-xl px-3 py-2" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="font-medium">Unit Price (₦)</label>
                            <input type="number" name="unit_price" value={form.unit_price || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                        <div>
                            <label className="font-medium">Min. Units</label>
                            <input type="number" name="min_units" value={form.min_units || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                        <div>
                            <label className="font-medium">Max Units (Opt.)</label>
                            <input type="number" name="max_units" value={form.max_units || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                         <div>
                            <label className="font-medium">Supplier ID</label>
                            <input type="number" name="supplier_id" value={form.supplier_id || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="font-medium">Restricted State (Optional)</label>
                        <select name="target_state" value={form.target_state || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2 bg-white">
                            <option value="">Anywhere (Unrestricted)</option>
                            <option value="Lagos">Lagos</option>
                            <option value="Ogun">Ogun</option>
                            <option value="Abuja">Abuja</option>
                            <option value="Ibadan">Ibadan</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">For perishable items (meat, veg), restricting to a single state is recommended.</p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        <label className="flex items-center gap-2"><input type="checkbox" name="visible" checked={!!form.visible} onChange={handleChange} /> Visible to Users</label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="allow_oversubscribe" checked={!!form.allow_oversubscribe} onChange={handleChange} /> Allow Oversubscription</label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="auto_cancel_if_under_min" checked={!!form.auto_cancel_if_under_min} onChange={handleChange} /> Auto-cancel if Min not met</label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-6 border-t mt-6">
                    <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={() => onSave(form)} disabled={isSaving} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save GroupBuy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const GroupBuys: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Partial<GroupBuy> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { add: addToast } = useToasts();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getGroupBuys();
            setGroupBuys(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load GroupBuys.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadData() }, [loadData]);

    const handleSave = async (groupBuy: Partial<GroupBuy>) => {
        setIsSaving(true);
        try {
            await upsertGroupBuy(groupBuy);
            addToast({ title: 'Success', desc: 'GroupBuy saved successfully.', emoji: '✅' });
            setEditing(null);
            loadData();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not save GroupBuy.', emoji: '😥' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">GroupBuy Management</h2>
                <button onClick={() => setEditing({})} className="px-4 py-2 rounded-xl bg-brand text-white font-semibold">
                    New GroupBuy
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse"></div>)
                ) : groupBuys.map(gb => {
                    const progress = gb.max_units ? ((gb.total_reserved_units || 0) / gb.max_units) * 100 : 
                                     gb.min_units ? ((gb.total_reserved_units || 0) / gb.min_units) * 100 : 0;
                    return (
                        <div key={gb.id} className="rounded-2xl border bg-white p-4 space-y-2 flex flex-col">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold">{gb.name}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[gb.status]}`}>{gb.status.replace('_', ' ')}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <strong>₦{gb.unit_price.toLocaleString()}</strong> per unit
                            </div>
                            {gb.target_state && (
                                <div className="inline-block px-2 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 rounded border border-rose-100">
                                    📍 Restricted to {gb.target_state}
                                </div>
                            )}
                            <div className="flex-grow">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{gb.total_reserved_units || 0} units reserved</span>
                                    <span>{gb.max_units ? `of ${gb.max_units}` : `(min ${gb.min_units})`}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-brand h-2 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                                </div>
                            </div>
                            <div className="pt-2 text-right">
                                <button onClick={() => setEditing(gb)} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-100">
                                    Edit
                                </button>
                            </div>
                        </div>
                    );
                })}
                {!loading && groupBuys.length === 0 && (
                    <div className="lg:col-span-3 text-center p-8 text-gray-500">No GroupBuys found.</div>
                )}
            </div>

            {editing && (
                <GroupBuyEditor
                    groupBuy={editing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default GroupBuys;