
import React, { useState, useEffect, useCallback } from 'react';
import { getAggregatedCollateral, getRefinanceHistory, requestRefinanceLoan } from '../services/refinanceService';
import type { RefinanceRequest } from '../types';
import { useToasts } from '../components/ToastHost';
import { useKyc } from '../hooks/useKyc';
import { supabase } from '../supabaseClient';
import type { Page } from '../App';

const koboToNaira = (k: number) => (k / 100);
const getTomorrowISOString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

const getCollateralStatus = (status: string) => {
    switch (status) {
        case 'active': return 'Locked';
        case 'pending': return 'Pending Lock';
        case 'repaid': return 'Released';
        case 'defaulted': return 'Liquidated';
        case 'rejected': return 'Returned';
        default: return 'Unknown';
    }
};

const LoanRequest: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [collateral, setCollateral] = useState(0);
    const [history, setHistory] = useState<RefinanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(10000);
    const [repaymentDate, setRepaymentDate] = useState(getTomorrowISOString());
    const [isRequesting, setIsRequesting] = useState(false);
    const { add: addToast } = useToasts();
    const [userId, setUserId] = useState<string | undefined>();
    const { status: kycStatus } = useKyc(userId);
    const kycVerified = kycStatus === 'verified';

    useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id));
    }, []);
    
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [collateralData, historyData] = await Promise.all([
                getAggregatedCollateral(),
                getRefinanceHistory()
            ]);
            setCollateral(collateralData.total_available_kobo);
            setHistory(historyData);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load refinance data.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleRequest = async () => {
        if (amount * 100 > collateral) {
            addToast({ title: 'Amount too high', desc: 'Loan amount cannot exceed available collateral.', emoji: '⚠️' });
            return;
        }
        if (new Date(repaymentDate) <= new Date()) {
            addToast({ title: 'Invalid Date', desc: 'Repayment date must be in the future.', emoji: '📅' });
            return;
        }

        setIsRequesting(true);
        try {
            await requestRefinanceLoan(amount * 100, new Date(repaymentDate).toISOString());
            addToast({ title: 'Request Submitted', desc: 'Your loan request is pending approval.', emoji: '✅' });
            setAmount(10000);
            setRepaymentDate(getTomorrowISOString());
            loadData(); // Refresh data
        } catch (e: any) {
            addToast({ title: 'Request Failed', desc: e.message, emoji: '😥' });
        } finally {
            setIsRequesting(false);
        }
    };

    const statusColors: Record<string, string> = {
        active: 'text-blue-700 bg-blue-50 border-blue-200',
        pending: 'text-amber-700 bg-amber-50 border-amber-200',
        repaid: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        rejected: 'text-rose-700 bg-rose-50 border-rose-200',
        defaulted: 'text-rose-900 bg-rose-100 border-rose-300',
    };

    return (
        <div className="space-y-4">
            <button onClick={() => setPage('standing')} className="text-sm text-gray-600 hover:text-brand transition">← Back to My Standing</button>
            <h2 className="text-2xl font-semibold">Request Refinance Loan</h2>
            <div className="grid md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-2xl border bg-white p-4">
                        <h3 className="font-semibold text-lg">New Loan Application</h3>
                        <p className="text-xs text-gray-500 mt-1">Leverage your available collateral from Ajo pools for short-term liquidity.</p>
                        
                        <div className="mt-3 rounded-xl border bg-slate-50 p-3">
                            <div className="text-xs text-gray-500">Total Available Collateral</div>
                            <div className="text-2xl font-bold">₦{koboToNaira(collateral).toLocaleString()}</div>
                        </div>

                        <div className="mt-3">
                            <label htmlFor="loan-amount" className="text-sm font-medium">Loan Amount (₦)</label>
                            <input 
                                id="loan-amount"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                className="w-full mt-1 border rounded-xl px-3 py-2"
                                max={koboToNaira(collateral)}
                            />
                        </div>

                        <div className="mt-3">
                            <label htmlFor="repayment-date" className="text-sm font-medium">Desired Repayment Date</label>
                            <input 
                                id="repayment-date"
                                type="date"
                                value={repaymentDate}
                                onChange={e => setRepaymentDate(e.target.value)}
                                min={getTomorrowISOString()}
                                className="w-full mt-1 border rounded-xl px-3 py-2"
                            />
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                            Interest: 5% flat (mock)
                        </div>

                        <button 
                            onClick={handleRequest} 
                            disabled={isRequesting || amount <= 0 || loading || !kycVerified} 
                            title={!kycVerified ? 'Complete KYC to request loans' : ''}
                            className="w-full mt-3 px-4 py-2 rounded-xl bg-brand text-white font-semibold disabled:opacity-50"
                        >
                            {isRequesting ? 'Submitting...' : `Request Loan of ₦${amount.toLocaleString()}`}
                        </button>
                    </div>
                </div>
                <div className="md:col-span-3 rounded-2xl border bg-white p-4">
                    <h3 className="font-semibold text-lg">My Refinance History</h3>
                    <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto">
                        {loading && <p>Loading history...</p>}
                        {!loading && history.map(req => (
                            <div key={req.id} className="p-3 border-b text-sm last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-semibold text-gray-900">Loan: ₦{koboToNaira(req.amount_kobo).toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                         <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColors[req.status] || ''}`}>
                                            {req.status}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">Due: {new Date(req.repayment_due_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg">
                                    <span className="text-slate-500">Collateral:</span>
                                    <span className="font-medium text-slate-700">₦{koboToNaira(req.collateral_locked_kobo).toLocaleString()}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className={`font-medium ${
                                        req.status === 'active' ? 'text-amber-600' : 
                                        req.status === 'repaid' ? 'text-emerald-600' : 
                                        req.status === 'defaulted' ? 'text-rose-600' : 'text-slate-500'
                                    }`}>
                                        {getCollateralStatus(req.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {!loading && history.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No refinance history found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanRequest;
