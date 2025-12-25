
import React, { useState, useEffect } from 'react';
import { joinPool, recordContribution, withdrawCollateral } from '../services/poolService';
import { adjustTrust } from '../services/gamificationService';
import type { PoolDetailsData, PoolTP } from '../types';
import { getNaijaToast } from '../services/geminiService';
import type { Page } from '../App';
import { useToasts } from '../components/ToastHost';
import { useKyc } from '../hooks/useKyc';
import { usePin } from '../components/security/PinContext';
import { supabase } from '../supabaseClient';
import GuarantorModal from '../components/pools/GuarantorModal';
import { ShareModal } from '../components/ui/ShareModal';
import { OdogwuReceipt } from '../components/ui/OdogwuReceipt';
import { ShimmerButton } from '../components/ui/ShimmerButton';


const InflationShieldCard: React.FC<{ contributed: number }> = ({ contributed }) => {
    // Mock Logic for Demo:
    // Assume original exchange rate was 1400 NGN/USDC. Current rate 1550 NGN/USDC.
    // If user contributed 300,000 NGN, that was $214.28.
    // Now $214.28 is worth 214.28 * 1550 = 332,134 NGN.
    // Gain = 32,134 NGN.
    
    if (contributed <= 0) return null;

    const originalRate = 1400;
    const currentRate = 1565; // Naira depreciated
    const usdcValue = contributed / originalRate;
    const currentValueNaira = usdcValue * currentRate;
    const gain = currentValueNaira - contributed;
    const gainPct = (gain / contributed) * 100;

    return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-100 rounded-bl-full opacity-50"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                        <span>🛡️</span> Inflation Shield Active
                    </h3>
                    <p className="text-xs text-emerald-700 mt-1">Your savings are pegged to USDC.</p>
                </div>
                <div className="bg-white/60 backdrop-blur px-2 py-1 rounded text-xs font-mono text-emerald-800 border border-emerald-200">
                    1 USDC = ₦{currentRate.toLocaleString()}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 relative z-10">
                <div>
                    <div className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Nominal Value</div>
                    <div className="text-lg font-bold text-emerald-800">₦{contributed.toLocaleString()}</div>
                </div>
                <div>
                    <div className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Real Value</div>
                    <div className="text-lg font-bold text-emerald-900">₦{Math.round(currentValueNaira).toLocaleString()}</div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200/50 flex items-center gap-2 relative z-10">
                <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                    +{gainPct.toFixed(1)}%
                </span>
                <span className="text-xs text-emerald-800">
                    You saved <strong>₦{Math.round(gain).toLocaleString()}</strong> by hedging.
                </span>
            </div>
        </div>
    );
};


const CollateralCard: React.FC<{ data: PoolDetailsData; onWithdraw: () => Promise<void> }> = ({ data, onWithdraw }) => {
    const { collateral, pool } = data;
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const { add: addToast } = useToasts();
    const [userId, setUserId] = useState<string | undefined>();
    const { status: kycStatus } = useKyc(userId);
    const { requestPin } = usePin();
    const kycVerified = kycStatus === 'verified';

    useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id));
    }, []);

    const handleWithdraw = async () => {
        if (!collateral || collateral.available_amount <= 0) return;
        
        setIsWithdrawing(true);
        try {
            const approved = await requestPin('withdraw collateral');
            if (!approved) {
                setIsWithdrawing(false);
                return;
            }

            await onWithdraw();
            addToast({ title: 'Withdrawal Initiated', desc: 'Your available collateral has been sent to your wallet.', emoji: '💸' });
        } catch (e: any) {
            addToast({ title: 'Withdrawal Failed', desc: e.message, emoji: '😥' });
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (!collateral) {
        return (
            <div className="rounded-2xl border bg-slate-100 p-4 text-center">
                <p className="text-sm text-gray-600">Join this pool to activate your collateral account.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <h3 className="font-semibold text-indigo-900">Your Collateral Account</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <div className="text-xs text-indigo-700">Locked Amount</div>
                    <div className="text-xl font-bold text-indigo-900">₦{collateral.locked_amount.toLocaleString()}</div>
                </div>
                <div>
                    <div className="text-xs text-indigo-700">Available for Withdrawal</div>
                    <div className="text-xl font-bold text-indigo-900">₦{collateral.available_amount.toLocaleString()}</div>
                </div>
            </div>
             {collateral.available_amount > 0 && (
                <div className="mt-3">
                    <button 
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !kycVerified}
                        title={!kycVerified ? 'Complete KYC to withdraw' : ''}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {isWithdrawing ? 'Processing...' : `Withdraw ₦${collateral.available_amount.toLocaleString()}`}
                    </button>
                </div>
             )}
            <p className="text-xs text-indigo-600 mt-2">
                Collateral is locked as you contribute and becomes available {pool.min_lock_cycles} cycles after your last contribution.
            </p>
        </div>
    );
};

const ObligationsList: React.FC<{ data: PoolDetailsData; onContribute: (cycleId: string, amount: number) => Promise<void> }> = ({ data, onContribute }) => {
    const { obligations, membership } = data;
    const [isPaying, setIsPaying] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | undefined>();
    const { status: kycStatus } = useKyc(userId);
    const { requestPin } = usePin();
    const kycVerified = kycStatus === 'verified';

    useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id));
    }, []);

    const handlePay = async (cycleId: string, amount: number) => {
        setIsPaying(cycleId);
        try {
            const approved = await requestPin(`pay ₦${amount.toLocaleString()} contribution`);
            if (!approved) {
                setIsPaying(null);
                return;
            }

            // Note: Optimistic UI logic is handled in the parent component via onContribute
            await onContribute(cycleId, amount); 
        } catch(e) {
            console.error(e);
        } finally {
            setIsPaying(null);
        }
    };

    if (!membership) return null;

    return (
        <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold">My Contribution Cycles</h3>
            <div className="space-y-2 mt-2">
                {obligations.map(ob => {
                    const isDue = new Date(ob.cycle.due_date) <= new Date() && !ob.is_settled;
                    const isUpcoming = new Date(ob.cycle.due_date) > new Date() && !ob.is_settled;

                    return (
                        <div key={ob.id} className="grid grid-cols-3 items-center gap-2 text-sm p-2 rounded-lg border transition-all duration-300">
                            <div>
                                <div className="font-medium">Cycle {ob.cycle.cycle_number}</div>
                                <div className="text-xs text-gray-500">Due: {new Date(ob.cycle.due_date).toLocaleDateString()}</div>
                            </div>
                            <div className="text-center">
                                {ob.is_settled ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 animate-fade-in">Paid</span>
                                ) : isDue ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Due</span>
                                ) : (
                                     <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">Upcoming</span>
                                )}
                            </div>
                            <div className="text-right">
                                {!ob.is_settled && isDue && (
                                    <ShimmerButton
                                        onClick={() => handlePay(ob.cycle_id, ob.contribution_due)}
                                        disabled={isPaying === ob.cycle_id || !kycVerified}
                                        title={!kycVerified ? 'Complete KYC to pay' : ''}
                                        className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
                                    >
                                        {isPaying === ob.cycle_id ? 'Paying...' : `Pay ₦${ob.contribution_due.toLocaleString()}`}
                                    </ShimmerButton>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- GAMIFICATION COMPONENT: Rotation Visualizer ---
const RotationVisualizer: React.FC<{ pool: PoolTP }> = ({ pool }) => {
    // 12 positions for a standard Ajo year/cycle.
    // Calculate dynamic collateral based on the same formula used in poolService.
    const positions = Array.from({ length: 12 }, (_, i) => {
        const pos = i + 1;
        const totalSlots = 12;
        
        // --- NEW LOGIC: Collateral scales from 100% (Pos 1) to 0% (Pos 12) ---
        const maxDiscount = 1.0; // 100% max discount means last person pays 0 collateral
        const positionFactor = Math.min(1, Math.max(0, (pos - 1) / (totalSlots - 1))); // 0 at start, 1 at end
        const discountMultiplier = 1 - (positionFactor * maxDiscount); // 1.0 down to 0.0
        
        const collateralAmt = Math.round(pool.base_amount * pool.collateral_ratio * discountMultiplier);
        
        return {
            pos,
            status: i < 3 ? 'paid' : i === 3 ? 'current' : 'waiting', // Simulating we are in month 4
            // Mock: User has TWO hands in this pool (Position 2 and Position 11) to show "carry two or more hands"
            isUser: i === 1 || i === 10, 
            trustBonus: Math.floor((i + 1) * 1.5), // Later positions get more trust points
            collateralAmt,
            payoutDate: new Date(Date.now() + (i - 3) * 30 * 24 * 60 * 60 * 1000)
        };
    });

    const currentPos = positions.find(p => p.status === 'current');
    const userPos = positions.find(p => p.isUser); // First user position found for est payout
    
    return (
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50 p-5 shadow-sm overflow-hidden relative">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Payout Queue</h3>
                    <p className="text-xs text-gray-500">
                        {userPos && currentPos ? (
                            <span>You hold <strong>2 hands</strong> (Pos #{positions.filter(p=>p.isUser).map(p=>p.pos).join(' & #')}).</span>
                        ) : "Rotation Schedule"}
                    </p>
                </div>
                {userPos && (
                    <div className="bg-white/80 backdrop-blur border border-brand-100 px-3 py-1 rounded-full text-xs font-semibold text-brand-700 shadow-sm">
                        Est. Payout: {userPos.payoutDate.toLocaleDateString(undefined, { month:'short', day:'numeric' })}
                    </div>
                )}
            </div>

            {/* The Track */}
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full z-0"></div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 relative z-10 snap-x scrollbar-hide">
                    {positions.map((p) => (
                        <div key={p.pos} className="flex flex-col items-center min-w-[64px] snap-center group">
                            {/* The Bubble */}
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300 relative
                                ${p.status === 'paid' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : ''}
                                ${p.status === 'current' ? 'bg-brand-600 border-brand-200 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' : ''}
                                ${p.status === 'waiting' ? (p.isUser ? 'bg-white border-brand-600 text-brand-700' : 'bg-white border-slate-200 text-slate-400') : ''}
                            `}>
                                {p.status === 'paid' ? '✓' : p.pos}
                            </div>

                            {/* Status Label */}
                            <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-center">
                                {p.status === 'current' && <span className="text-brand-600 animate-pulse">Turn</span>}
                                {p.isUser && <span className="text-gray-900 font-bold">You</span>}
                                {p.status === 'waiting' && !p.isUser && <span className="text-slate-400">{p.payoutDate.toLocaleDateString(undefined, {month:'short'})}</span>}
                                {p.status === 'paid' && !p.isUser && <span className="text-emerald-600">Paid</span>}
                            </div>
                            
                            {/* Collateral Badge (The main new feature) */}
                            <div className={`mt-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold whitespace-nowrap ${p.collateralAmt === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                {p.collateralAmt === 0 ? '0 Col (Free)' : `₦${(p.collateralAmt/1000).toFixed(1)}k Col`}
                            </div>

                            {/* Hover/Details - Trust Bonus Gamification */}
                            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-slate-800 text-white px-2 py-0.5 rounded-full whitespace-nowrap absolute -top-8">
                                +{p.trustBonus} Trust Pts
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Legend / Gamification Hint */}
            <div className="mt-2 pt-3 border-t border-brand-100/50 flex flex-col gap-1 text-xs text-gray-500 bg-white/50 rounded-lg p-2">
                <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span>
                        <strong>Dynamic Collateral:</strong> Early players pay 100% collateral. Late players (Anchors) pay <span className="text-emerald-600 font-bold">0% collateral</span> and earn higher Trust Scores.
                    </span>
                </div>
            </div>
        </div>
    );
};


interface PoolDetailsProps {
    poolData: PoolDetailsData;
    onBack: () => void;
    isAuthenticated: boolean;
    setPage: (page: Page) => void;
}

const PoolDetails: React.FC<PoolDetailsProps> = ({ poolData, onBack, isAuthenticated, setPage }) => {
    const { pool, membership, guarantorRequests } = poolData;
    const [isJoining, setIsJoining] = useState(false);
    const { add: addToast } = useToasts();
    const { requestPin } = usePin();
    const [version, setVersion] = useState(0); 
    const forceRefresh = () => setVersion(v => v + 1);
    const [userId, setUserId] = useState<string | undefined>();
    const { status: kycStatus } = useKyc(userId);
    const [showGuarantorModal, setShowGuarantorModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // Receipt State
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptAmount, setReceiptAmount] = useState(0);
    const [receiptTitle, setReceiptTitle] = useState('');
    
    const [data, setData] = useState(poolData);
    
    // Sync state when prop changes, unless we are optimistically updated
    useEffect(() => {
        setData(poolData);
    }, [poolData]);

    useEffect(() => {
        // FIX: v1 compatibility wrapper for getUser
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            return { data: { user } };
        }).then(({ data: { user } }) => setUserId(user?.id));

        if (version > 0) {
            window.location.reload();
        }
    }, [version, pool.id]);


    const handleJoin = async () => {
        if (!isAuthenticated) {
            addToast({ title: "Sign In Required", desc: "Please sign in to join this pool.", emoji: "🔒" });
            setPage('auth');
            return;
        }
        if (!userId) return;

        setIsJoining(true);

        try {
            const approved = await requestPin('join pool');
            if (!approved) {
                setIsJoining(false);
                return;
            }

            await joinPool(pool.id, userId);
            const toast = await getNaijaToast('JOIN_SUCCESS', `Pool: ${pool.name}`);
            addToast(toast);
            
            // Show Receipt
            setReceiptAmount(pool.base_amount);
            setReceiptTitle(`Joined: ${pool.name}`);
            setShowReceipt(true);
            
            forceRefresh();
        } catch (e: any) {
            if (e.message === "GUARANTOR_REQUIRED") {
                setShowGuarantorModal(true);
            } else {
                addToast({ title: 'Error', desc: e.message, emoji: '😥' });
            }
            setIsJoining(false);
        }
    };

    const handleContribute = async (cycleId: string, amount: number) => {
        if (!isAuthenticated) {
            addToast({ title: "Sign In Required", desc: "Please sign in to contribute.", emoji: "🔒" });
            setPage('auth');
            return;
        }
        if (!userId) return;
        
        // Optimistic Update
        const prevData = { ...data };
        const updatedObligations = data.obligations.map(o => 
            o.cycle_id === cycleId ? { ...o, is_settled: true } : o
        );
        setData({ ...data, obligations: updatedObligations });

        try {
            await recordContribution(pool.id, userId, cycleId);
            addToast({ title: 'Payment Recorded!', desc: 'Your contribution for this cycle is settled.', emoji: '✅' });
            
            // Show Receipt
            setReceiptAmount(amount);
            setReceiptTitle(`Paid: ${pool.name}`);
            setShowReceipt(true);

            try {
                await adjustTrust(userId, 5, 'On-time Ajo payment');
                const trustToast = await getNaijaToast('TRUST_INCREASE');
                addToast({ ...trustToast, desc: `${trustToast.desc} (+5 Trust)` });
            } catch (e) {
                console.error("Failed to give trust score toast", e);
            }
        } catch (e: any) {
            setData(prevData); // Rollback
            addToast({ title: 'Payment Failed', desc: e.message, emoji: '😥' });
        }
    };
    
    const handleWithdrawCollateral = async () => {
        if (!userId) return;
        await withdrawCollateral(pool.id, userId);
        forceRefresh();
    };

    const acceptedGuarantors = guarantorRequests?.filter(r => r.status === 'accepted').length || 0;

    // Calculate total contributed for Inflation Shield visualization
    const totalContributed = data.obligations
        .filter(o => o.is_settled)
        .reduce((sum, o) => sum + o.contribution_due, 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-sm text-gray-600 hover:text-brand transition">← Back to Explore</button>
                <button 
                    onClick={() => setShowShareModal(true)} 
                    className="flex items-center gap-1 text-sm font-semibold text-brand bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 hover:bg-brand-100 transition"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share
                </button>
            </div>
            
            <h2 className="text-2xl font-semibold">{pool.name}</h2>

            {!isAuthenticated && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 animate-pulse-slow">
                    <span className="text-2xl">👀</span>
                    <div>
                        <div className="font-bold text-amber-800 text-sm">Guest Preview Mode</div>
                        <p className="text-xs text-amber-700">You are viewing this pool as a guest. Sign up to join and start saving.</p>
                    </div>
                </div>
            )}

            <RotationVisualizer pool={pool} />

            {/* Inflation Shield Card (New) */}
            {pool.inflation_shield && (
                <InflationShieldCard contributed={totalContributed} />
            )}

            <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <div className="text-sm text-gray-500 uppercase">{pool.frequency} Contribution</div>
                <p className="text-sm text-gray-700 mt-1">
                    Contribute <strong>₦{pool.base_amount.toLocaleString()}</strong> every cycle.
                    Your contribution includes a refundable collateral portion (see chart above for rates).
                </p>

                <div className="mt-4 flex items-center justify-between">
                    <div>
                    {pool.base_amount > 100000 && !membership && (
                        <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block mb-1 border border-amber-100">
                            High Value Pool: Requires 2 Guarantors
                        </div>
                    )}
                    </div>
                    {membership ? (
                        <ShimmerButton
                            onClick={handleJoin}
                            disabled={isJoining}
                            className="px-4 py-2 rounded-xl text-sm"
                        >
                            {isJoining ? 'Adding Hand...' : '+ Add Another Hand'}
                        </ShimmerButton>
                    ) : (
                        <ShimmerButton
                            onClick={handleJoin}
                            disabled={isJoining}
                            className="px-4 py-2 rounded-xl text-sm"
                        >
                            {isJoining ? 'Joining...' : 'Join this Pool'}
                        </ShimmerButton>
                    )}
                </div>
            </div>
            
            {isAuthenticated && (
                <>
                    <CollateralCard data={data} onWithdraw={handleWithdrawCollateral} />
                    <ObligationsList data={data} onContribute={handleContribute} />
                </>
            )}

            {showGuarantorModal && userId && (
                <GuarantorModal 
                    poolId={pool.id} 
                    userId={userId} 
                    acceptedCount={acceptedGuarantors}
                    onClose={() => setShowGuarantorModal(false)}
                    onSuccess={forceRefresh} 
                />
            )}

            {showShareModal && (
                <ShareModal 
                    title={pool.name}
                    shareId={pool.id}
                    type="pool"
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {showReceipt && userId && (
                <OdogwuReceipt 
                    type="contribution"
                    amount={receiptAmount}
                    title={receiptTitle}
                    userName="Odogwu" // Ideally fetch user's name
                    date={new Date().toLocaleDateString()}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    );
};

export default PoolDetails;
