
import React, { useState, useEffect } from 'react';
import { useToasts } from '../ToastHost';
import { usePin } from '../security/PinContext';
import { registerSupplier } from '../../services/supplierService';
import { getBanks } from '../../services/bankService';

interface BecomeSupplierModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const BecomeSupplierModal: React.FC<BecomeSupplierModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<{name: string, code: string}[]>([]);
    
    const [form, setForm] = useState({
        business_name: '',
        contact_person: '',
        phone: '',
        email: '',
        bank_code: '',
        account_number: '',
    });

    const { add: addToast } = useToasts();
    const { requestPin } = usePin();

    useEffect(() => {
        getBanks().then(setBanks).catch(() => {});
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validateStep1 = () => {
        return form.business_name && form.contact_person && form.phone && form.email;
    };

    const validateStep2 = () => {
        return form.bank_code && form.account_number.length >= 10;
    };

    const handleSubmit = async () => {
        // 1. Security Challenge
        const approved = await requestPin('register as a supplier');
        if (!approved) return;

        setLoading(true);
        try {
            await registerSupplier(form);
            addToast({ 
                title: 'Application Submitted', 
                desc: 'Your supplier profile is pending admin verification.', 
                emoji: '📜' 
            });
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Registration Failed', desc: e.message, emoji: '😥' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">Become a Supplier</h3>
                        <p className="text-slate-400 text-sm mt-1">Sell bulk goods to community groups.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {step === 1 ? (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Business Details</label>
                                <input 
                                    name="business_name"
                                    value={form.business_name}
                                    onChange={handleChange}
                                    placeholder="Business Name (e.g. Iya Moria Agro)"
                                    className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Contact Person</label>
                                <input 
                                    name="contact_person"
                                    value={form.contact_person}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
                                    <input 
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="080..."
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                                    <input 
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Email"
                                        className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 items-start">
                                <span className="text-xl">🔒</span>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    We require valid bank details for settlement. Your account will be verified before you can list products.
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Bank</label>
                                <select 
                                    name="bank_code"
                                    value={form.bank_code}
                                    onChange={handleChange}
                                    className="w-full border rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                                >
                                    <option value="">Select Bank</option>
                                    {banks.map(b => (
                                        <option key={b.code} value={b.code}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Account Number</label>
                                <input 
                                    name="account_number"
                                    value={form.account_number}
                                    onChange={handleChange}
                                    placeholder="10-digit number"
                                    maxLength={10}
                                    className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none font-mono tracking-wide"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                    {step === 2 && (
                        <button 
                            onClick={() => setStep(1)}
                            className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition"
                        >
                            Back
                        </button>
                    )}
                    
                    {step === 1 ? (
                        <button 
                            onClick={() => validateStep1() && setStep(2)}
                            disabled={!validateStep1()}
                            className="flex-1 px-6 py-3 rounded-xl bg-brand text-white font-bold shadow-lg shadow-brand/20 hover:bg-brand-700 transition disabled:opacity-50 disabled:shadow-none"
                        >
                            Next: Banking
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !validateStep2()}
                            className="flex-1 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? 'Submitting...' : (
                                <>
                                    <span>Submit Application</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BecomeSupplierModal;
