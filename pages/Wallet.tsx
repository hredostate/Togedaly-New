
import React, { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { supabase } from '../supabaseClient';
import { initiatePayment } from '../services/paystackService';
import { getWalletBalance } from '../services/poolService';
import { canTopup } from '../services/kycService';
import { useToasts } from '../components/ToastHost';
import { getVirtualAccounts, getProviders, createDva, getIncomingTransfers, simulateChargeSuccessWebhook } from '../services/dvaService';
import type { VirtualAccount } from '../types';
import NarrationBuilder from '../components/wallet/NarrationBuilder';
import ReceiptScanner from '../components/wallet/ReceiptScanner';
import SpendingAnalyzer from '../components/wallet/SpendingAnalyzer';
import { USSDPayment } from '../components/wallet/USSDPayment';
import { OdogwuReceipt } from '../components/ui/OdogwuReceipt';
import { ShimmerButton } from '../components/ui/ShimmerButton';


const DedicatedVirtualAccountPanel: React.FC = () => {
  const { data: accounts } = useSWR('virtual-accounts', getVirtualAccounts);
  const { data: providers } = useSWR('providers', getProviders);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [creating, setCreating] = useState(false);
  const { add: addToast } = useToasts();

  const handleCreate = async () => {
    if (!selectedProvider) return;
    setCreating(true);
    try {
      const newAccount = await createDva(selectedProvider);
      addToast({ title: "Account Created!", desc: `Your new ${newAccount.bank} account is ready.`, emoji: "🎉" });
      // SWR will auto-revalidate if we mutate, or we can just rely on focus revalidation
    } catch (e: any) {
      addToast({ title: "Error", desc: e.message || "Failed to create account.", emoji: "😥" });
    } finally {
      setCreating(false);
    }
  };

  if (!accounts || !providers) {
    return (
      <div className="rounded-2xl border bg-white p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-3">
      <div className="font-semibold text-lg">Fund via Bank Transfer</div>
      {accounts.length > 0 ? (
        accounts.map(dva => (
          <div key={dva.id} className="text-sm rounded-xl border bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-gray-500">Account Name</div>
              <div className="font-mono text-right">{dva.account_name}</div>
              <div className="text-gray-500">Account Number</div>
              <div className="font-mono text-right font-semibold">{dva.account_number}</div>
              <div className="text-gray-500">Bank</div>
              <div className="font-mono text-right">{dva.bank_name}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <select className="border rounded-xl px-3 py-2 col-span-2 bg-white" value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}>
            <option value="">Select Provider Bank</option>
            {providers.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
          <button onClick={handleCreate} disabled={!selectedProvider || creating} className="px-3 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50">
            {creating ? '...' : 'Create'}
          </button>
        </div>
      )}
      <div className="text-xs text-center text-gray-500 pt-2">
        Transfers to this dedicated account will automatically credit your Togedaly wallet.
      </div>
    </div>
  );
};

const IncomingTransfersPanel: React.FC = () => {
    const { data: transfers, isLoading } = useSWR('incoming-transfers', getIncomingTransfers);

    return (
        <div className="rounded-2xl border bg-white p-6 space-y-3">
            <h3 className="font-semibold text-lg">Transfer History</h3>
            <div className="space-y-2">
                {isLoading && <p className="text-sm text-gray-500">Loading history...</p>}
                {!isLoading && (!transfers || transfers.length === 0) && <p className="text-sm text-gray-500">No incoming transfers yet.</p>}
                {!isLoading && transfers?.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50">
                        <div>
                            <span className="font-medium">From {t.sender_bank}</span>
                            <span className="text-gray-600 block text-xs">{t.narration} • {new Date(t.created_at).toLocaleString()}</span>
                        </div>
                        <div className="font-semibold text-emerald-700">+ ₦{(t.amount_kobo / 100).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WebhookSimulator: React.FC<{ accounts: VirtualAccount[] }> = ({ accounts }) => {
    const [narration, setNarration] = useState('AJO-COMMUNITY');
    const [simulating, setSimulating] = useState(false);
    const { add: addToast } = useToasts();
    const { mutate } = useSWRConfig();

    const handleSimulate = async () => {
        const myAccount = accounts.find(a => a.user_id === 'mock-user-id');
        if (!myAccount) {
            addToast({ title: 'No DVA', desc: 'Create a dedicated account first to simulate a transfer.', emoji: '🏦' });
            return;
        }

        setSimulating(true);
        const mockPayload = {
            event: 'charge.success',
            data: {
                id: Math.floor(Date.now() * Math.random()), // Unique transaction ID
                amount: 1500000, // ₦15,000
                authorization: {
                    channel: 'dedicated_nuban',
                    receiver_bank_account_number: myAccount.account_number,
                    sender_bank: 'Mock Sender Bank',
                    sender_account_number: '...9876',
                    narration: narration,
                }
            }
        };

        try {
            const result = await simulateChargeSuccessWebhook(mockPayload);
            addToast({ title: 'Webhook Processed', desc: result.message || '', emoji: result.ok ? '✅' : '⚠️', timeout: 8000 });
            // Refresh the transfers list to show the new incoming transfer
            mutate('incoming-transfers');
        } catch (e: any) {
            addToast({ title: 'Simulation Error', desc: e.message, emoji: '😥' });
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <h3 className="font-semibold text-amber-900 text-sm">Admin: Simulate Incoming Transfer</h3>
            <p className="text-xs text-amber-800">Test idempotency and routing. This simulates a Paystack webhook for a ₦15,000 transfer to your DVA.</p>
            <div className="flex gap-2 items-center">
                <input 
                    value={narration} 
                    onChange={e => setNarration(e.target.value)} 
                    placeholder="Narration (e.g., AJO-MYGROUP)"
                    className="border rounded-lg px-2 py-1 text-sm flex-grow"
                />
                <button onClick={handleSimulate} disabled={simulating} className="px-3 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50">
                    {simulating ? '...' : 'Simulate'}
                </button>
            </div>
        </div>
    );
};


const Wallet: React.FC = () => {
  const [amount, setAmount] = useState(5000);
  const [user, setUser] = useState<any | null>(null);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'fund' | 'ussd' | 'tools'>('fund');
  const [showReceipt, setShowReceipt] = useState(false);
  const { add: addToast } = useToasts();

  const { data: balanceKobo, isLoading: balanceLoading } = useSWR('wallet-balance', getWalletBalance);
  const { data: virtualAccounts } = useSWR('virtual-accounts', getVirtualAccounts);

  useEffect(() => {
    const getCurrentUser = async () => {
        const auth = supabase.auth as any;
        const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
        setUser(user);
    };
    getCurrentUser();
  }, []);
  
  // Auth guard: Show message if user is not authenticated
  if (user === null) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to access your wallet.</p>
      </div>
    );
  }
  
  async function topup() {
    if (!user || !user.email) {
        addToast({title: 'Authentication Error', desc: 'Please sign in to fund your wallet.', emoji: '🔒'});
        return;
    }
    
    setIsToppingUp(true);
    try {
        const { allowed, reason } = await canTopup(amount);
        if (!allowed) {
            addToast({ title: 'Limit Reached', desc: reason, emoji: '🚫'});
            setIsToppingUp(false);
            return;
        }
        await initiatePayment(user.email, amount, user.id, addToast);
        // Simulate immediate success for the demo to show the receipt
        setTimeout(() => setShowReceipt(true), 3500); 
    } catch (e: any) {
        addToast({ title: 'Error', desc: 'Something went wrong. Please try again.', emoji: '😥'});
    } finally {
        setIsToppingUp(false);
    }
  }

  const balanceNaira = balanceKobo !== undefined 
    ? (balanceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) 
    : '...';

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500">Wallet Balance</div>
        {balanceLoading ? (
            <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mt-1"></div>
        ) : (
            <div className="text-3xl font-semibold text-gray-800">{balanceNaira}</div>
        )}
        <p className="text-xs text-gray-400 mt-2">Your wallet is credited automatically after a successful payment.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setActiveTab('fund')} 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'fund' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
          >
            Card
          </button>
          <button 
            onClick={() => setActiveTab('ussd')} 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'ussd' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
          >
            USSD
          </button>
          <button 
            onClick={() => setActiveTab('tools')} 
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'tools' ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}
          >
            Smart Tools ✨
          </button>
      </div>

      {activeTab === 'fund' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl border border-brand-100 bg-white p-6 space-y-3">
                <div className="font-semibold text-lg">Top up via Paystack</div>
                <div>
                    <label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount (₦)</label>
                    <input 
                        id="amount"
                        type="number"
                        value={amount} 
                        onChange={e => setAmount(parseInt(e.target.value || '0'))} 
                        className="w-full mt-1 rounded-xl border-gray-300 border px-3 py-2 focus:ring-brand focus:border-brand" 
                        placeholder="e.g., 5000"
                    />
                </div>
                <ShimmerButton 
                    onClick={topup} 
                    disabled={!user || amount < 100 || isToppingUp}
                    className="w-full py-3 rounded-xl disabled:opacity-50"
                >
                    {isToppingUp ? 'Checking...' : `Pay ₦${amount.toLocaleString()}`}
                </ShimmerButton>
                <div className="text-xs text-center text-gray-500 pt-2">You will be redirected to Paystack's secure checkout. This is a mock transaction.</div>
            </div>
            
            <DedicatedVirtualAccountPanel />
            <NarrationBuilder />
            <IncomingTransfersPanel />
            {virtualAccounts && <WebhookSimulator accounts={virtualAccounts} />}
          </div>
      )}
      
      {activeTab === 'ussd' && (
          <div className="space-y-4 animate-fade-in">
              <USSDPayment />
              <DedicatedVirtualAccountPanel />
          </div>
      )}

      {activeTab === 'tools' && (
          <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-800 px-1">AI Financial Assistant</h2>
              <div className="grid gap-4">
                  <ReceiptScanner />
                  <SpendingAnalyzer />
              </div>
          </div>
      )}

      {showReceipt && (
          <OdogwuReceipt 
            type="deposit"
            amount={amount}
            title="Wallet Top-Up"
            userName={user?.user_metadata?.full_name || "Odogwu"}
            date={new Date().toLocaleDateString()}
            onClose={() => setShowReceipt(false)}
          />
      )}

    </div>
  );
};

export default Wallet;
