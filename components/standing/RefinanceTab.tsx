
import React from 'react';
import useSWR from 'swr';
import { getAggregatedCollateral, getRefinanceHistory } from '../../services/refinanceService';
import type { Page } from '../../App';

const koboToNaira = (k: number) => (k / 100);

const RefinanceTab: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const { data: collateralData, isLoading: loadingCollateral } = useSWR('agg-collateral', getAggregatedCollateral);
    const { data: historyData, isLoading: loadingHistory } = useSWR('refinance-history', getRefinanceHistory);

    const collateral = collateralData?.total_available_kobo || 0;
    const loading = loadingCollateral || loadingHistory;

    return (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
            <h3 className="font-semibold text-lg">Refinance Loans</h3>
            <p className="text-sm text-gray-600">Leverage your available collateral from Ajo pools for short-term liquidity.</p>
            
            <div className="mt-3 rounded-xl border bg-slate-50 p-4">
                <div className="text-sm text-gray-500">Total Available Collateral</div>
                {loading ? (
                    <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mt-1"></div>
                ) : (
                    <div className="text-3xl font-bold">₦{koboToNaira(collateral).toLocaleString()}</div>
                )}
            </div>

            <button 
                onClick={() => setPage('loanRequest')}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-brand text-white font-semibold disabled:opacity-50"
            >
                Request a New Loan
            </button>
        </div>
    );
};

export default RefinanceTab;
