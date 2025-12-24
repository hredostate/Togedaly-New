
import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../App';
import type { Supplier, SupplierStatus, SupplierSku } from '../types';
import { getSuppliers, upsertSupplier } from '../services/supplierService';
import { useToasts } from '../components/ToastHost';

const statusOptions: SupplierStatus[] = ['draft', 'submitted', 'verified', 'active', 'suspended'];

const statusColors: Record<SupplierStatus, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-blue-100 text-blue-700 border-blue-200',
    verified: 'bg-amber-100 text-amber-700 border-amber-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    suspended: 'bg-rose-100 text-rose-700 border-rose-200',
};

const SkuEditor: React.FC<{ skus: SupplierSku[], onChange: (skus: SupplierSku[]) => void }> = ({ skus, onChange }) => {
    const [newSku, setNewSku] = useState<Partial<SupplierSku>>({});

    const addSku = () => {
        if (!newSku.name || !newSku.price_kobo) return;
        const sku: SupplierSku = {
            id: `sku-${Date.now()}`,
            name: newSku.name,
            unit: newSku.unit || 'unit',
            price_kobo: Number(newSku.price_kobo),
            moq: Number(newSku.moq || 1),
            stock_level: newSku.stock_level || 'medium',
            description: newSku.description
        };
        onChange([...skus, sku]);
        setNewSku({});
    };

    const removeSku = (id: string) => {
        onChange(skus.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-sm border-b pb-1">Product Catalog (SKUs)</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {skus.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border text-xs">
                        <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-gray-500">₦{(s.price_kobo / 100).toLocaleString()} / {s.unit} • MOQ: {s.moq}</div>
                        </div>
                        <button onClick={() => removeSku(s.id)} className="text-rose-500 hover:text-rose-700">Remove</button>
                    </div>
                ))}
                {skus.length === 0 && <div className="text-xs text-gray-400 text-center">No SKUs added yet.</div>}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                <input placeholder="Item Name" className="border rounded p-1" value={newSku.name || ''} onChange={e => setNewSku({ ...newSku, name: e.target.value })} />
                <input type="number" placeholder="Price (Kobo)" className="border rounded p-1" value={newSku.price_kobo || ''} onChange={e => setNewSku({ ...newSku, price_kobo: Number(e.target.value) })} />
                <input placeholder="Unit (e.g. bag)" className="border rounded p-1" value={newSku.unit || ''} onChange={e => setNewSku({ ...newSku, unit: e.target.value })} />
                <input type="number" placeholder="MOQ" className="border rounded p-1" value={newSku.moq || ''} onChange={e => setNewSku({ ...newSku, moq: Number(e.target.value) })} />
                <button onClick={addSku} className="col-span-2 bg-slate-800 text-white rounded p-1 hover:bg-slate-700">Add SKU</button>
            </div>
        </div>
    );
};

const SupplierEditor: React.FC<{
    supplier: Partial<Supplier>;
    onSave: (supplier: Partial<Supplier>) => void;
    onCancel: () => void;
    isSaving: boolean;
}> = ({ supplier, onSave, onCancel, isSaving }) => {
    const [form, setForm] = useState(supplier);
    const [tab, setTab] = useState<'basic' | 'logistics' | 'skus'>('basic');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLogisticsChange = (key: string, value: any) => {
        setForm(prev => ({
            ...prev,
            logistics: { ...prev.logistics, [key]: value } as any
        }));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={onCancel}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{supplier.id ? 'Edit Supplier' : 'Create New Supplier'}</h3>
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                        {(['basic', 'logistics', 'skus'] as const).map(t => (
                            <button 
                                key={t} 
                                onClick={() => setTab(t)} 
                                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="overflow-y-auto p-1 flex-1">
                    {tab === 'basic' && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="font-medium">Business Name</label>
                                <input name="business_name" value={form.business_name || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                            </div>
                            <div>
                                <label className="font-medium">Display Name</label>
                                <input name="display_name" value={form.display_name || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                            </div>
                            <div>
                                <label className="font-medium">Contact Person</label>
                                <input name="contact_person" value={form.contact_person || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                            </div>
                            <div>
                                <label className="font-medium">Contact Phone</label>
                                <input name="phone" value={form.phone || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                            </div>
                            <div>
                                <label className="font-medium">Contact Email</label>
                                <input type="email" name="email" value={form.email || ''} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2" />
                            </div>
                            <div>
                                <label className="font-medium">Status</label>
                                <select name="status" value={form.status || 'draft'} onChange={handleChange} className="w-full mt-1 border rounded-xl px-3 py-2 bg-white">
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {tab === 'logistics' && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-medium">KYC Tier</label>
                                    <select 
                                        value={form.logistics?.kyc_tier || 'basic'} 
                                        onChange={e => handleLogisticsChange('kyc_tier', e.target.value)} 
                                        className="w-full mt-1 border rounded-xl px-3 py-2 bg-white"
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="verified">Verified</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-medium">Lead Time (Days)</label>
                                    <input 
                                        type="number" 
                                        value={form.logistics?.lead_time_days || ''} 
                                        onChange={e => handleLogisticsChange('lead_time_days', Number(e.target.value))} 
                                        className="w-full mt-1 border rounded-xl px-3 py-2" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-medium">Min Order Value (Kobo)</label>
                                <input 
                                    type="number" 
                                    value={form.logistics?.min_order_value_kobo || ''} 
                                    onChange={e => handleLogisticsChange('min_order_value_kobo', Number(e.target.value))} 
                                    className="w-full mt-1 border rounded-xl px-3 py-2" 
                                />
                            </div>
                            <div>
                                <label className="font-medium">Delivery Areas (comma separated)</label>
                                <input 
                                    value={form.logistics?.delivery_areas?.join(', ') || ''} 
                                    onChange={e => handleLogisticsChange('delivery_areas', e.target.value.split(',').map(s => s.trim()))} 
                                    className="w-full mt-1 border rounded-xl px-3 py-2" 
                                    placeholder="Lagos, Abuja..." 
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'skus' && (
                        <SkuEditor skus={form.skus || []} onChange={skus => setForm({ ...form, skus })} />
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={() => onSave(form)} disabled={isSaving} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Supplier'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const Suppliers: React.FC<{ setPage: (page: Page, context?: any) => void }> = ({ setPage }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { add: addToast } = useToasts();

    const loadSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load suppliers.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const handleSave = async (supplier: Partial<Supplier>) => {
        setIsSaving(true);
        try {
            await upsertSupplier(supplier);
            addToast({ title: 'Success', desc: 'Supplier saved successfully.', emoji: '✅' });
            setEditingSupplier(null);
            loadSuppliers();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message || 'Could not save supplier.', emoji: '😥' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold">Supplier Management</h2>
                 <button onClick={() => setEditingSupplier({ business_name: '', status: 'draft' })} className="px-4 py-2 rounded-xl bg-brand text-white font-semibold">
                    New Supplier
                 </button>
            </div>
            <div className="rounded-2xl border bg-white overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-3 text-left">Business Name</th>
                            <th className="p-3 text-left">Contact</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Rating</th>
                            <th className="p-3 text-left">KYC</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading suppliers...</td></tr>
                        ) : suppliers.map(s => (
                            <tr key={s.id} className="border-b">
                                <td className="p-3 font-medium">
                                    {s.display_name || s.business_name}
                                    <div className="text-xs text-gray-500">{s.skus?.length || 0} SKUs</div>
                                </td>
                                <td className="p-3">
                                    <div>{s.contact_person}</div>
                                    <div className="text-xs text-gray-500">{s.email || s.phone}</div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[s.status]}`}>{s.status}</span>
                                </td>
                                <td className="p-3">{s.rating_average.toFixed(1)} ({s.rating_count})</td>
                                <td className="p-3 capitalize text-xs">{s.logistics?.kyc_tier || 'basic'}</td>
                                <td className="p-3">
                                    <button onClick={() => setEditingSupplier(s)} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-100">
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && suppliers.length === 0 && (
                            <tr><td colSpan={6} className="p-6 text-center text-gray-500">No suppliers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingSupplier && (
                <SupplierEditor
                    supplier={editingSupplier}
                    onSave={handleSave}
                    onCancel={() => setEditingSupplier(null)}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default Suppliers;
