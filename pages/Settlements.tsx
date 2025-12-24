'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../App';
import { useToasts } from '../components/ToastHost';
import { getSettlementBalances } from '../services/settlementService';
import { getSuppliers } from '../services/supplierService';
import { getBanks } from '../services/bankService';
import { supabase } from '../supabaseClient';
// FIX: Added VGroupbuySupplierBalance to correctly type data from the service.
import type { VGroupbuySupplierBalance } from '../types';

const MOCK_ORG_ID = 1;

export default function Settlements({ setPage }: { setPage: (page: Page) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { add: addToast } = useToasts();

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [balanceData, suppliersData, banksData] = await Promise.all([
        getSettlementBalances(),
        getSuppliers(),
        getBanks(),
      ]);

      // FIX: Explicitly type the accumulator to resolve type errors in reduce and subsequent map.
      const balancesBySupplier = balanceData.reduce((acc: Record<string, {
        supplier_id: number;
        supplier_name?: string;
        balance: number;
        last_groupbuy_id: number | null;
        last_settlement_id: number;
      }>, b: VGroupbuySupplierBalance) => {
        if (!acc[b.supplier_id]) {
          acc[b.supplier_id] = {
            supplier_id: b.supplier_id,
            supplier_name: b.supplier_name,
            balance: 0,
            last_groupbuy_id: null,
            last_settlement_id: 0,
          };
        }
        acc[b.supplier_id].balance += b.remaining_due;
        if (b.settlement_id > acc[b.supplier_id].last_settlement_id) {
          acc[b.supplier_id].last_groupbuy_id = b.groupbuy_id;
          acc[b.supplier_id].last_settlement_id = b.settlement_id;
        }
        return acc;
      }, {});

      const aggregatedRows = Object.values(balancesBySupplier).map(agg => {
        const supplier = suppliersData.find(s => s.id === agg.supplier_id);
        const bank = banksData.find(b => b.name === supplier?.bank_name);
        return {
          ...agg,
          bank_code: bank?.code,
          account_number: supplier?.account_number,
          account_name: supplier?.account_name,
        };
      }).filter(row => row.balance > 0.01);

      setRows(aggregatedRows);
    } catch (e: any) {
      addToast({ title: 'Error loading data', desc: e.message, emoji: '😥' });
    } finally {
      setLoadingData(false);
    }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handlePayout() {
    if (!selected) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('supplier_payouts').insert({
        org_id: MOCK_ORG_ID,
        supplier_id: selected.supplier_id,
        amount: Number(amount || selected.balance),
        status: 'queued',
        reference: `sup-${selected.supplier_id}-${Date.now()}`,
        bank_code: selected.bank_code,
        account_number: selected.account_number,
        account_name: selected.account_name,
      });

      if (error) throw error;

      addToast({ title: 'Payout Queued', desc: 'Payout has been queued for processing.', emoji: '🚀' });
      setSelected(null);
      setAmount('');
      await loadData();
    } catch (e: any) {
      addToast({ title: 'Payout Failed', desc: e.message || 'An unexpected error occurred.', emoji: '😥' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Settlements</h1>
          <p className="text-sm text-gray-500">
            See what you owe suppliers from GroupBuys and trigger payouts.
          </p>
        </div>
      </header>

      <div className="border rounded-xl overflow-auto bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left font-semibold">Supplier</th>
              <th className="p-3 text-left font-semibold">Balance (₦)</th>
              <th className="p-3 text-left font-semibold">Last GroupBuy ID</th>
              <th className="p-3 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loadingData && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading...</td></tr>
            )}
            {!loadingData && rows.map((r: any) => (
              <tr key={r.supplier_id} className="odd:bg-gray-50/50 border-t">
                <td className="p-3 font-medium">{r.supplier_name}</td>
                <td className="p-3 font-semibold">₦{Number(r.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3">{r.last_groupbuy_id ?? '-'}</td>
                <td className="p-3 text-right">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                    onClick={() => {
                      setSelected(r);
                      setAmount(String(r.balance.toFixed(2)));
                    }}
                  >
                    Pay Out
                  </button>
                </td>
              </tr>
            ))}
             {!loadingData && rows.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No outstanding balances.</td></tr>
             )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">
              Pay {selected.supplier_name}
            </h2>
            <p className="text-sm text-gray-500">
              Current balance: ₦{Number(selected.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <label className="block text-sm">
              Amount to pay (₦)
              <input
                type="number"
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                className="px-3 py-2 text-sm rounded-xl border"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-60"
                disabled={loading}
                onClick={handlePayout}
              >
                {loading ? 'Processing…' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}