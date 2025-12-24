'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { Page } from '../App';
import type { Payout, PayoutRecipient } from '../types';
import { useToasts } from '../components/ToastHost';
import { getPendingPayouts, getPayoutRecipients, createPayoutRecipient, processPayout } from '../services/disbursementService';
import { getBanks } from '../services/bankService';
import ReceiptUploadModal from '../components/admin/ReceiptUploadModal';

const nf = (n: number) => `₦${n.toLocaleString()}`;

const AddRecipientModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
    const [type, setType] = useState<'user' | 'supplier'>('user');
    const [id, setId] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [banks, setBanks] = useState<{name: string, code: string}[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { add: addToast } = useToasts();

    useEffect(() => {
        getBanks().then(setBanks);
    }, []);

    const handleSave = async () => {
        if (!id || !bankCode || !accountNumber) {
            addToast({ title: 'Missing fields', desc: 'Please fill all required fields.', emoji: '📝'});
            return;
        }
        setIsSaving(true);
        try {
            await createPayoutRecipient({ type, id, bank_code: bankCode, account_number: accountNumber });
            addToast({ title: 'Recipient Created', desc: 'The new payout recipient has been saved.', emoji: '✅'});
            onSuccess();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Add Payout Recipient</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <label className="font-medium">Recipient Type</label>
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full mt-1 border rounded-xl px-3 py-2 bg-white">
                            <option value="user">User</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>
                    <div>
                        <label className="font-medium">{type === 'user' ? 'User ID' : 'Supplier ID'}</label>
                        <input value={id} onChange={e => setId(e.target.value)} className="w-full mt-1 border rounded-xl px-3 py-2" />
                    </div>
                </div>
                <div className="text-sm">
                    <label className="font-medium">Bank</label>
                    <select value={bankCode} onChange={e => setBankCode(e.target.value)} className="w-full mt-1 border rounded-xl px-3 py-2 bg-white">
                        <option value="">Select a bank</option>
                        {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                </div>
                <div className="text-sm">
                    <label className="font-medium">Account Number</label>
                    <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full mt-1 border rounded-xl px-3 py-2" />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm rounded-xl bg-brand text-white disabled:opacity-50">
                        {isSaving ? 'Verifying...' : 'Save Recipient'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Disbursements({ setPage }: { setPage: (page: Page, context?: any) => void }){
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [recipients, setRecipients] = useState<PayoutRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [uploadingPayout, setUploadingPayout] = useState<Payout | null>(null);
  const { add: addToast } = useToasts();
  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
        const [payoutsData, recipientsData] = await Promise.all([getPendingPayouts(), getPayoutRecipients()]);
        setPayouts(payoutsData);
        setRecipients(recipientsData);
    } catch (e: any) {
        addToast({ title: 'Error', desc: 'Could not load disbursement data.', emoji: '😥' });
    } finally {
        setLoading(false);
    }
  }, [addToast]);
  
  useEffect(() => { loadData() }, [loadData]);

  const handleProcess = async (payout: Payout) => {
    if (!confirm(`Process payout of ${nf(payout.amount)} to ${payout.beneficiaryName}?`)) return;
    
    setProcessingId(payout.id);
    try {
        await processPayout(payout.id, payout.target === 'cycle' ? 'cycle' : 'settlement');
        addToast({ title: 'Payout Settled', desc: 'The transfer has been processed.', emoji: '💸'});
        loadData();
    } catch (e: any) {
        addToast({ title: 'Error', desc: e.message, emoji: '😥' });
    } finally {
        setProcessingId(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payouts Dashboard</h1>
        <p className="text-sm text-gray-500">Review and process pending disbursements for Ajo cycles and supplier settlements.</p>
      </div>
      
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pending Payouts</h2>
        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-semibold">Beneficiary</th>
                <th className="text-left p-3 font-semibold">Amount</th>
                <th className="text-left p-3 font-semibold">Source</th>
                <th className="text-left p-3 font-semibold">Created At</th>
                <th className="text-left p-3 font-semibold">Receipt</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center p-4">Loading pending payouts...</td></tr>}
              {!loading && payouts.map((p:any)=> (
                <tr key={`${p.target}-${p.id}`} className="border-b">
                  <td className="p-3 font-medium">
                      <div>{p.beneficiaryName}</div>
                      <div className="text-xs text-gray-500 font-mono">{p.beneficiaryId}</div>
                  </td>
                  <td className="p-3 font-semibold">{nf(p.amount)}</td>
                  <td className="p-3 capitalize">{p.target} #{p.sourceId}</td>
                  <td className="p-3 text-xs text-gray-600">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-3 text-xs">
                    {p.receipt_url ? (
                        <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-brand underline">View</a>
                    ) : (
                        <button onClick={() => setUploadingPayout(p)} className="text-gray-500 underline">Upload</button>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {p.target === 'cycle' && p.pool_id && p.sourceId && (
                          <button 
                            onClick={() => setPage('cycleRotation', { poolId: p.pool_id, cycleId: p.sourceId })}
                            className="px-3 py-1.5 rounded-lg border text-xs hover:bg-slate-100"
                          >
                            View Cycle
                          </button>
                        )}
                        <button 
                            onClick={() => handleProcess(p)} 
                            disabled={processingId === p.id}
                            className="px-3 py-1.5 rounded-lg border text-xs bg-brand text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                            {processingId === p.id ? 'Processing...' : 'Process'}
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
               {!loading && payouts.length === 0 && <tr><td colSpan={6} className="text-center p-6 text-gray-500">No pending payouts. All caught up!</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Payout Recipients</h2>
            <button onClick={() => setShowAddRecipient(true)} className="px-4 py-2 rounded-xl border text-sm font-semibold">Add Recipient</button>
        </div>
        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-semibold">Recipient</th>
                <th className="text-left p-3 font-semibold">Bank Details</th>
                <th className="text-left p-3 font-semibold">Provider Code</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr>}
              {!loading && recipients.map((r:any)=> (
                <tr key={r.id} className="border-b">
                  <td className="p-3 font-medium capitalize">
                      {r.user_id ? 'User' : 'Supplier'}
                      <div className="text-xs text-gray-500 font-mono">{r.user_id || r.supplier_id}</div>
                  </td>
                  <td className="p-3">
                      <div>{r.account_name}</div>
                      <div className="text-xs text-gray-500">{r.bank_code} - {r.account_number}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{r.recipient_code}</td>
                </tr>
              ))}
              {!loading && recipients.length === 0 && <tr><td colSpan={3} className="text-center p-6 text-gray-500">No payout recipients configured.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showAddRecipient && <AddRecipientModal onClose={() => setShowAddRecipient(false)} onSuccess={() => { setShowAddRecipient(false); loadData(); }} />}
      {uploadingPayout && (
        <ReceiptUploadModal
            payoutId={uploadingPayout.id}
            payoutType={uploadingPayout.target as 'cycle' | 'settlement'}
            onClose={() => setUploadingPayout(null)}
            onSuccess={() => {
                setUploadingPayout(null);
                loadData();
            }}
        />
      )}
    </div>
  );
}