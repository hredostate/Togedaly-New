
import React, { useState } from 'react';
import type { LegacyPool, WaybillData } from '../../types';
import { useToasts } from '../ToastHost';
import { usePin } from '../security/PinContext';
import { contributeToLegacyPool } from '../../services/poolService';

interface WaybillDetailsProps {
    pool: LegacyPool;
    isAuthenticated: boolean;
    setPage: (page: any) => void;
}

const WaybillDetails: React.FC<WaybillDetailsProps> = ({ pool, isAuthenticated, setPage }) => {
    const { add: addToast } = useToasts();
    const { requestPin } = usePin();
    
    // Local state to simulate updates that would go to backend
    const [wbData, setWbData] = useState<WaybillData>(pool.waybillData || {
        origin: 'Unknown',
        destination: 'Unknown',
        itemDescription: 'Item',
        status: 'waiting_funds',
        arrivalState: 'Unknown'
    });
    
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [parkName, setParkName] = useState('');
    const [waybillNum, setWaybillNum] = useState('');
    const [showDriverForm, setShowDriverForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Amounts
    const amount = pool.base_amount_kobo;
    const isFunded = pool.raised_amount_kobo >= amount;

    // Actions
    const handleFundEscrow = async () => {
        if (!isAuthenticated) {
            addToast({ title: 'Auth Required', desc: 'Please sign in to fund escrow.', emoji: '🔒' });
            setPage('auth');
            return;
        }
        setIsProcessing(true);
        try {
            const approved = await requestPin(`fund ₦${(amount / 100).toLocaleString()}`);
            if (approved) {
                await contributeToLegacyPool(pool.id, amount);
                setWbData(prev => ({ ...prev, status: 'pending_dropoff' }));
                addToast({ title: 'Escrow Funded', desc: 'Funds locked. Seller can now drop off item.', emoji: '🔒' });
                window.dispatchEvent(new CustomEvent('trigger-confetti'));
            }
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmitWaybill = async () => {
        if (!driverName || !driverPhone || !parkName || !waybillNum) {
            addToast({ title: 'Missing Info', desc: 'Please fill all driver details.', emoji: '📝' });
            return;
        }
        setIsProcessing(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));
        
        setWbData(prev => ({
            ...prev,
            logistics_provider: parkName,
            driver_phone: driverPhone,
            waybill_number: waybillNum,
            status: 'in_transit'
        }));
        
        setShowDriverForm(false);
        setIsProcessing(false);
        addToast({ title: 'Waybill Updated', desc: 'Buyer notified. Item is now in transit.', emoji: '🚚' });
    };

    const handleConfirmReceipt = async () => {
        setIsProcessing(true);
        try {
            const approved = await requestPin('release funds to seller');
            if (approved) {
                // Simulate backend release
                await new Promise(r => setTimeout(r, 1000));
                setWbData(prev => ({ ...prev, status: 'funds_released' }));
                addToast({ title: 'Transaction Complete', desc: 'Funds released to seller.', emoji: '✅' });
                window.dispatchEvent(new CustomEvent('trigger-confetti'));
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Render Steps
    const currentStep = 
        wbData.status === 'waiting_funds' ? 1 : 
        wbData.status === 'pending_dropoff' ? 2 : 
        wbData.status === 'in_transit' ? 3 : 4;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 text-[100px] opacity-10">🚚</div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <span className="bg-white/20 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-white/10">
                            Waybill Escrow
                        </span>
                        <div className="text-right">
                            <div className="text-xs text-slate-300">Amount</div>
                            <div className="text-xl font-bold text-emerald-400">₦{(amount/100).toLocaleString()}</div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mt-4 mb-1">{pool.name}</h2>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <span>{wbData.origin}</span>
                        <span>→</span>
                        <span>{wbData.destination}</span>
                    </p>
                </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold mb-4 text-gray-900">Delivery Status</h3>
                <div className="flex justify-between relative">
                    {/* Line */}
                    <div className="absolute top-3 left-0 right-0 h-1 bg-slate-100 -z-0"></div>
                    <div className="absolute top-3 left-0 h-1 bg-emerald-500 -z-0 transition-all duration-500" style={{ width: `${((currentStep-1)/3)*100}%` }}></div>

                    {[
                        { label: 'Funded', icon: '🔒' },
                        { label: 'Dropped', icon: '📦' },
                        { label: 'Transit', icon: '🚚' },
                        { label: 'Done', icon: '✅' }
                    ].map((s, i) => {
                        const active = i + 1 <= currentStep;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 z-10">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-colors ${active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                    {active ? s.icon : i+1}
                                </div>
                                <span className={`text-[10px] font-medium ${active ? 'text-emerald-700' : 'text-slate-400'}`}>{s.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Action Card based on State */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
                
                {/* STATE 1: Waiting for Funds */}
                {wbData.status === 'waiting_funds' && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-3xl">🛡️</div>
                        <div>
                            <h3 className="text-lg font-bold">Secure Your Purchase</h3>
                            <p className="text-sm text-gray-500">Deposit funds into escrow. We notify the seller to drop off the item.</p>
                        </div>
                        <button 
                            onClick={handleFundEscrow}
                            disabled={isProcessing}
                            className="w-full py-3 bg-brand text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition"
                        >
                            {isProcessing ? 'Processing...' : `Lock ₦${(amount/100).toLocaleString()}`}
                        </button>
                    </div>
                )}

                {/* STATE 2: Pending Drop-off (Seller Action Mock) */}
                {wbData.status === 'pending_dropoff' && (
                    <div className="space-y-4">
                        {!showDriverForm ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-3xl mb-3">📦</div>
                                <h3 className="text-lg font-bold">Waiting for Waybill</h3>
                                <p className="text-sm text-gray-500 mb-4">Funds are locked. Waiting for seller to upload waybill details.</p>
                                <button 
                                    onClick={() => setShowDriverForm(true)}
                                    className="text-xs text-brand font-medium underline"
                                >
                                    (Mock: Act as Seller)
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                <h3 className="font-bold text-gray-900 border-b pb-2">Enter Waybill Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Park Name (e.g. GIGM)" className="border rounded-xl p-2 text-sm" value={parkName} onChange={e=>setParkName(e.target.value)} />
                                    <input placeholder="Waybill Number" className="border rounded-xl p-2 text-sm" value={waybillNum} onChange={e=>setWaybillNum(e.target.value)} />
                                    <input placeholder="Driver Name" className="border rounded-xl p-2 text-sm" value={driverName} onChange={e=>setDriverName(e.target.value)} />
                                    <input placeholder="Driver Phone" className="border rounded-xl p-2 text-sm" value={driverPhone} onChange={e=>setDriverPhone(e.target.value)} />
                                </div>
                                <button 
                                    onClick={handleSubmitWaybill}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
                                >
                                    {isProcessing ? 'Submitting...' : 'Submit Waybill'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* STATE 3: In Transit */}
                {wbData.status === 'in_transit' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-center">
                            <div className="text-3xl">🚌</div>
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm">On the way to {wbData.arrivalState}</h4>
                                <div className="text-xs text-blue-700 mt-1">
                                    Via: <strong>{wbData.logistics_provider}</strong><br/>
                                    Waybill: <span className="font-mono bg-white px-1 rounded">{wbData.waybill_number}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <a href={`tel:${wbData.driver_phone}`} className="flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-medium hover:bg-slate-50">
                                <span>📞</span> Call Driver
                            </a>
                            <button className="flex items-center justify-center gap-2 py-3 border rounded-xl text-sm font-medium hover:bg-slate-50">
                                <span>📍</span> Track
                            </button>
                        </div>

                        <div className="pt-4 border-t">
                            <button 
                                onClick={handleConfirmReceipt}
                                disabled={isProcessing}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition"
                            >
                                {isProcessing ? 'Releasing...' : 'I have received the item'}
                            </button>
                            <p className="text-[10px] text-center text-gray-400 mt-2">Only click this after inspecting your package.</p>
                        </div>
                    </div>
                )}

                {/* STATE 4: Completed */}
                {wbData.status === 'funds_released' && (
                    <div className="text-center py-6">
                        <div className="text-5xl mb-3">🤝</div>
                        <h3 className="text-xl font-bold text-gray-900">Transaction Closed</h3>
                        <p className="text-sm text-gray-500">Funds released to seller. Thank you for using Togedaly Escrow.</p>
                        <button onClick={() => setPage('explore')} className="mt-4 text-brand font-medium text-sm hover:underline">Start another</button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default WaybillDetails;