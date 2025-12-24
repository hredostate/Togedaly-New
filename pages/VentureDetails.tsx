
import React, { useState, useEffect } from 'react';
import type { LegacyPool, Milestone, VentureRoadmap, FulfillmentEvent } from '../types';
import { useOptimisticJoin } from '../hooks/useOptimisticJoin';
import { useOptimisticVote } from '../hooks/useOptimisticVote';
import { getPoolInsight } from '../services/geminiService';
import { useToasts } from '../components/ToastHost';
import { contributeToLegacyPool, voteOnMilestone, confirmGroupBuyReceipt } from '../services/poolService';
import { usePin } from '../components/security/PinContext';
import { SocialProofTicker } from '../components/marketing/SocialProofTicker';
import EventPotDetails from '../components/pools/EventPotDetails';
import WaybillDetails from '../components/pools/WaybillDetails';
import type { Page } from '../App';
import { ShareModal } from '../components/ui/ShareModal';

const koboToNaira = (k: number) => k / 100;

const AInsight: React.FC<{ pool: LegacyPool }> = ({ pool }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const result = await getPoolInsight(pool, question);
      setAnswer(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
      <h3 className="font-semibold text-amber-900">AI Insight</h3>
      <p className="text-xs text-amber-800">Ask Adviser T anything about this venture based on the details provided.</p>
      <div className="flex gap-2">
        <input 
          value={question} 
          onChange={e => setQuestion(e.target.value)} 
          placeholder="e.g., Is this a good investment for me?"
          className="flex-grow border rounded-lg px-2 py-1.5 text-sm"
        />
        <button onClick={ask} disabled={loading} className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50">
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </div>
      {answer && (
        <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg border border-amber-100 mt-2">
          {answer}
        </div>
      )}
    </div>
  );
};

interface MilestoneCardProps {
    milestone: Milestone;
    isAuthenticated: boolean;
    setPage: (page: Page) => void;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, isAuthenticated, setPage }) => {
    const { pct, vote, isVoting } = useOptimisticVote(milestone.yes_votes_pct);
    const voteColor = pct > 75 ? 'bg-emerald-500' : pct > 50 ? 'bg-brand' : 'bg-amber-500';
    const { requestPin } = usePin();
    const { add: addToast } = useToasts();

    const handleVote = async (v: 'yes' | 'no') => {
        if (!isAuthenticated) {
            addToast({ title: "Sign In Required", desc: "Please sign in to vote.", emoji: "🔒" });
            setPage('auth');
            return;
        }
        const approved = await requestPin(`vote ${v.toUpperCase()}`);
        if (approved) {
            vote(() => voteOnMilestone(milestone.id, v), v);
        }
    }

    return (
        <div className="rounded-xl border bg-slate-50 p-3">
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-800">{milestone.title}</h4>
                <div className="text-sm font-bold">₦{koboToNaira(milestone.amount_kobo).toLocaleString()}</div>
            </div>
            {milestone.status === 'voting' && (
                <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Voting in Progress</span>
                        <span>Yes Votes: {pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className={voteColor + " h-2 rounded-full transition-all duration-500"} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => handleVote('yes')} disabled={isVoting} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white disabled:opacity-50">Vote Yes</button>
                        <button onClick={() => handleVote('no')} disabled={isVoting} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-100 disabled:opacity-50">Vote No</button>
                    </div>
                </div>
            )}
            {milestone.status === 'approved' && (
                <div className="mt-2 text-xs text-emerald-700 font-semibold">✓ Approved ({milestone.yes_votes_pct}%)</div>
            )}
             {milestone.status === 'draft' && (
                <div className="mt-2 text-xs text-gray-500">Draft - Not yet open for voting.</div>
            )}
        </div>
    );
};

const VentureRoadmapView: React.FC<{ roadmap: VentureRoadmap }> = ({ roadmap }) => {
    return (
        <div className="rounded-2xl border bg-white p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Venture Roadmap</h3>
                <div className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100">
                    Projected ROI: {roadmap.projected_roi_pct}%
                </div>
            </div>
            
            <div className="relative pl-4 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {roadmap.phases.map((phase, i) => (
                    <div key={i} className="relative pl-6">
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${phase.status === 'completed' ? 'bg-emerald-500' : phase.status === 'active' ? 'bg-brand-500' : 'bg-slate-300'}`}>
                            {phase.status === 'completed' && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <div>
                            <div className="flex justify-between items-start">
                                <h4 className={`font-semibold text-sm ${phase.status === 'active' ? 'text-brand-700' : 'text-gray-800'}`}>{phase.name}</h4>
                                <span className="text-[10px] text-gray-500 bg-slate-50 px-2 py-0.5 rounded">{phase.date}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{phase.description}</p>
                            {phase.roi_target && (
                                <div className="mt-1 inline-block text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Target: {phase.roi_target}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
                <span>Start: {new Date(roadmap.start_date).toLocaleDateString()}</span>
                <span>Maturity: {new Date(roadmap.maturity_date).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const ManagerReputation: React.FC<{ score?: number }> = ({ score }) => {
    if (score === undefined) return null;

    let tier = { label: 'Risky', icon: '⚠️', color: 'text-rose-600', bg: 'bg-rose-50', desc: 'High Risk / Delinquent history' };
    if (score >= 90) tier = { label: 'The Odogwu', icon: '👑', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Verified Earner. Top-tier performance.' };
    else if (score >= 70) tier = { label: 'Reliable', icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Trusted Manager. Consistent returns.' };
    else if (score >= 50) tier = { label: 'Building', icon: '🔨', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'New / Building reputation.' };

    return (
        <div className={`rounded-2xl border p-4 ${tier.bg} border-opacity-50`}>
            <div className="flex items-center gap-3">
                <div className={`text-3xl p-2 bg-white rounded-full shadow-sm`}>{tier.icon}</div>
                <div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Manager Reputation</div>
                    <div className={`font-bold text-lg ${tier.color}`}>{tier.label} ({score}/100)</div>
                </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">{tier.desc}</p>
        </div>
    );
};

const CountdownTimer: React.FC<{ targetDate: string, onExpire: () => void }> = ({ targetDate, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(interval);
                setExpired(true);
                setTimeLeft('00:00:00');
                onExpire();
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onExpire]);

    if (expired) return null;

    return <span className="font-mono font-bold text-rose-600">{timeLeft}</span>;
};

const DisputeModal: React.FC<{ onClose: () => void, onSubmit: (reason: string) => void }> = ({ onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-fade-in-up">
                <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                    <span className="text-xl">⚠️</span> Report an Issue
                </h3>
                <p className="text-sm text-gray-600">
                    Raising a dispute will <strong>freeze the funds</strong> in escrow while Admin investigates. Please describe the problem with your delivery.
                </p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Item damaged, wrong quantity, not received..."
                    rows={3}
                    className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
                <div className="flex gap-2 justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50">Cancel</button>
                    <button 
                        onClick={() => onSubmit(reason)} 
                        disabled={!reason.trim()}
                        className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-200"
                    >
                        Raise Dispute
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeliveryTimelineCard: React.FC<{ pool: LegacyPool, isAuthenticated: boolean, setPage: (page: Page) => void }> = ({ pool, isAuthenticated, setPage }) => {
    const [confirmed, setConfirmed] = useState(false);
    const [disputed, setDisputed] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { add: addToast } = useToasts();
    const { requestPin } = usePin();

    // Default timeline if none provided (for safety)
    const timeline: FulfillmentEvent[] = pool.fulfillment_timeline || [
        { stage: 'funded', timestamp: new Date().toISOString(), completed: true },
        { stage: 'processing', timestamp: '', completed: false }
    ];

    const currentStageIndex = timeline.findIndex(e => !e.completed) === -1 ? timeline.length - 1 : timeline.findIndex(e => !e.completed) - 1;
    const isDelivered = timeline.find(e => e.stage === 'delivered')?.completed;
    const isSettled = timeline.find(e => e.stage === 'settled')?.completed;
    
    // Dispute Window Logic
    const disputeDeadline = pool.dispute_window_end;
    const isDisputeWindowOpen = isDelivered && !isSettled && !confirmed && !disputed && disputeDeadline && new Date(disputeDeadline) > new Date();

    const handleConfirm = async () => {
        if (!isAuthenticated) {
            addToast({ title: "Sign In Required", desc: "Please sign in to confirm delivery.", emoji: "🔒" });
            setPage('auth');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const approved = await requestPin('confirm receipt & release funds');
            if (approved) {
                await confirmGroupBuyReceipt(pool.id, 'mock-user-id');
                setConfirmed(true);
                addToast({ title: 'Receipt Confirmed', desc: 'Thanks! Funds released to supplier.', emoji: '🤝' });
                window.dispatchEvent(new CustomEvent('trigger-confetti'));
            }
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDispute = (reason: string) => {
        setShowDisputeModal(false);
        setDisputed(true);
        addToast({ title: 'Dispute Raised', desc: 'Funds frozen. Admin will review your case.', emoji: '🛡️' });
        // In real app: API call to create dispute record
    };

    const stageIcons: Record<string, string> = {
        funded: '💰', processing: '⚙️', shipped: '🚚', delivered: '📦', settled: '💸', disputed: '🛑'
    };

    return (
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Order Status</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${disputed ? 'bg-rose-100 text-rose-800' : isSettled || confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {disputed ? 'Disputed' : confirmed || isSettled ? 'Completed' : 'In Progress'}
                </span>
            </div>
            
            <div className="p-6 relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-slate-200"></div>

                <div className="space-y-6">
                    {timeline.map((event, idx) => {
                        const isCompleted = idx <= currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        
                        return (
                            <div key={idx} className="relative flex gap-4 items-start">
                                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300 ${isCompleted ? 'border-brand-500 text-brand-600 shadow-brand/20 shadow-lg' : 'border-slate-200 text-slate-300'} ${isCurrent ? 'scale-110 ring-4 ring-brand-100' : ''}`}>
                                    <span className="text-lg">{stageIcons[event.stage] || '•'}</span>
                                </div>
                                <div className="pt-2 flex-1">
                                    <div className={`font-semibold text-sm capitalize ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {event.stage}
                                    </div>
                                    {event.completed && event.timestamp && (
                                        <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                                    )}
                                    {event.note && (
                                        <div className="text-xs text-gray-500 mt-1 italic">"{event.note}"</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dispute / Action Area */}
            {isDisputeWindowOpen && (
                <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Action Required</div>
                        {disputeDeadline && (
                            <div className="text-xs bg-white px-2 py-1 rounded border border-indigo-100 text-gray-600 shadow-sm">
                                Auto-confirm in: <CountdownTimer targetDate={disputeDeadline} onExpire={() => setConfirmed(true)} />
                            </div>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        Please inspect your delivery. Funds are held in escrow for <span className="font-bold">24 hours</span> after delivery to allow for disputes.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setShowDisputeModal(true)}
                            className="py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 font-semibold text-sm transition"
                        >
                            Report Issue
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition transform active:scale-95"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Receipt'}
                        </button>
                    </div>
                </div>
            )}

            {/* Success State */}
            {(confirmed || isSettled) && !disputed && (
                <div className="p-4 bg-emerald-50 border-t border-emerald-100 text-center">
                    <div className="text-emerald-800 font-bold text-sm">Transaction Settled</div>
                    <div className="text-emerald-600 text-xs mt-1">Funds have been released to the supplier.</div>
                </div>
            )}

            {/* Disputed State */}
            {disputed && (
                <div className="p-4 bg-rose-50 border-t border-rose-100 text-center">
                    <div className="text-rose-800 font-bold text-sm">Under Dispute</div>
                    <div className="text-rose-600 text-xs mt-1">Funds are frozen pending investigation. Check 'My Standing' for updates.</div>
                </div>
            )}

            {showDisputeModal && <DisputeModal onClose={() => setShowDisputeModal(false)} onSubmit={handleDispute} />}
        </div>
    );
};

interface VentureDetailsProps {
    pool: LegacyPool;
    onBack: () => void;
    isAuthenticated: boolean;
    setPage: (page: Page) => void;
}

const VentureDetails: React.FC<VentureDetailsProps> = ({ pool, onBack, isAuthenticated, setPage }) => {
    
    // --- ROUTE TO SPECIALIZED VIEWS ---
    if (pool.poolType === 'event') {
        return (
            <div className="space-y-4">
                <button onClick={onBack} className="text-sm text-gray-600 hover:text-brand transition">← Back to Explore</button>
                <EventPotDetails pool={pool} isAuthenticated={isAuthenticated} setPage={setPage} />
            </div>
        );
    }

    if (pool.poolType === 'waybill') {
        return (
            <div className="space-y-4">
                <button onClick={onBack} className="text-sm text-gray-600 hover:text-brand transition">← Back to Explore</button>
                <WaybillDetails pool={pool} isAuthenticated={isAuthenticated} setPage={setPage} />
            </div>
        );
    }

    const { raised, join, isJoining } = useOptimisticJoin(pool.raised_amount_kobo);
    const [amount, setAmount] = useState(pool.min_contribution_kobo);
    const { add } = useToasts();
    const { requestPin } = usePin();
    const [showShareModal, setShowShareModal] = useState(false);
    
    const progress = pool.base_amount_kobo > 0 ? (raised / pool.base_amount_kobo) * 100 : 0;
    
    // Group Buy specific: Check if fully funded to show delivery UI
    const isGroupBuy = pool.poolType === 'group_buy';
    const isFullyFunded = progress >= 100;

    const handleJoin = async () => {
        if (!isAuthenticated) {
            add({ title: "Sign In Required", desc: "Please sign in to contribute.", emoji: "🔒" });
            setPage('auth');
            return;
        }
        if (amount < pool.min_contribution_kobo) {
            add({ title: "Contribution Too Low", desc: `Minimum is ₦${koboToNaira(pool.min_contribution_kobo).toLocaleString()}`, emoji: '💰' });
            return;
        }
        const approved = await requestPin(`contribute ₦${koboToNaira(amount).toLocaleString()}`);
        if (approved) {
            await join(() => contributeToLegacyPool(pool.id, amount), amount);
        }
    };

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
            
            {/* Social Proof Ticker for Group Buys to create urgency */}
            {isGroupBuy && <SocialProofTicker />}

            {!isAuthenticated && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 animate-pulse-slow">
                    <span className="text-2xl">👀</span>
                    <div>
                        <div className="font-bold text-amber-800 text-sm">Guest Preview Mode</div>
                        <p className="text-xs text-amber-700">You are viewing this venture as a guest. Sign up to join and invest.</p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <div className="rounded-2xl border bg-white p-4">
                         <h2 className="text-2xl font-semibold">{pool.name}</h2>
                         <p className="text-sm text-gray-600 mt-2">{pool.description}</p>
                    </div>
                    
                    <ManagerReputation score={pool.creator_score} />

                    <div className="rounded-2xl border bg-white p-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Raised: ₦{koboToNaira(raised).toLocaleString()}</span>
                            <span>Target: ₦{koboToNaira(pool.base_amount_kobo).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div className="bg-brand h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% funded</div>
                    </div>
                    
                    {/* Show Contribution UI only if not fully funded, OR Show Delivery Timeline if GroupBuy & Funded */}
                    {!isFullyFunded ? (
                        <div className="rounded-2xl border bg-white p-4 space-y-2">
                            <h3 className="font-semibold">Join this Pool</h3>
                            <div>
                                <label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount to Contribute (₦)</label>
                                <input 
                                    id="amount"
                                    type="number"
                                    value={koboToNaira(amount)} 
                                    onChange={e => setAmount(parseInt(e.target.value || '0') * 100)} 
                                    className="w-full mt-1 rounded-xl border-gray-300 border px-3 py-2 focus:ring-brand focus:border-brand" 
                                    placeholder={`Min ₦${koboToNaira(pool.min_contribution_kobo).toLocaleString()}`}
                                    min={koboToNaira(pool.min_contribution_kobo)}
                                />
                            </div>
                            <button onClick={handleJoin} disabled={isJoining} className="w-full px-4 py-2.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-700 transition disabled:opacity-50">
                                {isJoining ? 'Contributing...' : `Contribute ₦${koboToNaira(amount).toLocaleString()}`}
                            </button>
                        </div>
                    ) : isGroupBuy ? (
                        <DeliveryTimelineCard pool={pool} isAuthenticated={isAuthenticated} setPage={setPage} />
                    ) : null}
                     
                     {pool.roadmap && <VentureRoadmapView roadmap={pool.roadmap} />}

                     <AInsight pool={pool} />
                </div>

                <div className="lg:col-span-2 space-y-3">
                     <div className="rounded-2xl border bg-white p-4">
                        <h3 className="font-semibold">Milestones</h3>
                        <div className="space-y-2 mt-2">
                            {pool.milestones.length > 0 ? pool.milestones.map(m => (
                                <MilestoneCard key={m.id} milestone={m} isAuthenticated={isAuthenticated} setPage={setPage} />
                            )) : (
                                <p className="text-sm text-gray-500">No milestones defined for this pool.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showShareModal && (
                <ShareModal 
                    title={pool.name}
                    shareId={pool.id}
                    type={isGroupBuy ? 'group_buy' : 'pool'}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default VentureDetails;
