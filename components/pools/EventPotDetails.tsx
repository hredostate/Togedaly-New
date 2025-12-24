
import React, { useState, useEffect } from 'react';
import type { LegacyPool, EventItem } from '../../types';
import { useToasts } from '../ToastHost';
import { usePin } from '../security/PinContext';
import { contributeToLegacyPool } from '../../services/poolService';
import { remindAjoMember } from '../../services/analyticsService';
import { supabase } from '../../supabaseClient';
import { ShareModal } from '../ui/ShareModal';

interface TrustUpsellModalProps {
    amountKobo: number;
    onRegister: () => void;
    onGuestPay: () => void;
    onClose: () => void;
}

const TrustUpsellModal: React.FC<TrustUpsellModalProps> = ({ amountKobo, onRegister, onGuestPay, onClose }) => {
    // Logic: roughly 15 points for 50k NGN. (0.0003 points per Naira)
    const potentialPoints = Math.max(1, Math.floor((amountKobo / 100) * 0.0003));
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 text-white text-center relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10">
                        <div className="inline-block bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3 shadow-lg border border-white/10">
                            Wait!
                        </div>
                        <h3 className="text-2xl font-bold mb-1">Don't Waste Your Credit</h3>
                        <p className="text-indigo-200 text-sm">You are about to throw away valid history.</p>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center w-full shadow-inner">
                            <div className="text-xs text-gray-500 uppercase font-semibold">Potential Trust Score</div>
                            <div className="text-4xl font-extrabold text-emerald-600 mt-1">+{potentialPoints}</div>
                            <div className="text-xs text-emerald-700 mt-1 font-medium">Points available for this payment</div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                        Registered users build a <strong>Trust Score</strong> with every payment. This unlocks loans and "Pay Later" options.
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={onRegister}
                            className="w-full py-3 rounded-xl bg-brand text-white font-bold shadow-lg shadow-brand/20 hover:bg-brand-700 transition transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>🚀</span> Register & Claim Points
                        </button>
                        <button 
                            onClick={onGuestPay}
                            className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-700 transition"
                        >
                            Skip & Pay as Guest
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EventPotDetailsProps {
    pool: LegacyPool;
    isAuthenticated: boolean;
    setPage: (page: any) => void;
}

const EventPotDetails: React.FC<EventPotDetailsProps> = ({ pool, isAuthenticated, setPage }) => {
    const { add: addToast } = useToasts();
    const { requestPin } = usePin();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // For Payment Selection
    const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set()); // For "Mark as Collected"
    const [customAmount, setCustomAmount] = useState<number>(0);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // Mock local state for "Total Paid" by this user to simulate debt calculation
    // In a real app, this would come from the backend.
    const [totalPaid, setTotalPaid] = useState(0); 
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        Promise.resolve().then(async () => {
            const auth = supabase.auth as any;
            const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
            setUserId(user?.id || null);
        });
    }, []);

    const settings = pool.eventSettings;
    if (!settings) return <div className="p-4 text-center">Event settings not found.</div>;

    const isOrganizer = pool.created_by && userId === pool.created_by;

    const toggleItem = (id: string) => {
        const next = new Set(selectedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedItems(next);
    };

    const toggleCollected = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger row selection
        
        // --- CREDIT LOCK ---
        // Require identity for debt.
        if (!isAuthenticated) {
            addToast({ 
                title: "Identity Required", 
                desc: "You cannot owe money (collect on credit) without a registered account.", 
                emoji: "🔒" 
            });
            return;
        }

        const next = new Set(collectedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCollectedItems(next);
    };

    // Calculate totals
    const totalItemsCost = settings.items
        .filter(item => selectedItems.has(item.id))
        .reduce((sum, item) => sum + item.price_kobo, 0);
    
    const totalPayableKobo = totalItemsCost + (customAmount * 100);

    // Calculate Debt (Credit Mode)
    const valueCollected = settings.items
        .filter(item => collectedItems.has(item.id))
        .reduce((sum, item) => sum + item.price_kobo, 0);
    
    const currentDebt = Math.max(0, valueCollected - totalPaid);

    const handlePayClick = () => {
        if (totalPayableKobo <= 0) {
            addToast({ title: "Amount Zero", desc: "Please select an item or enter an amount.", emoji: "⚠️" });
            return;
        }

        if (!isAuthenticated) {
            setShowUpsell(true);
        } else {
            processPayment(false);
        }
    };

    const processPayment = async (isGuest: boolean) => {
        setPaying(true);
        setShowUpsell(false);
        try {
            if (!isGuest) {
                // Only request PIN for logged in users who have one
                const approved = await requestPin(`pay ₦${(totalPayableKobo/100).toLocaleString()}`);
                if (!approved) {
                    setPaying(false);
                    return;
                }
            } else {
                // Simulate guest processing delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            await contributeToLegacyPool(pool.id, totalPayableKobo);
            
            if (!isGuest) {
                setTotalPaid(prev => prev + totalPayableKobo); // Update local mock state
            }
            
            setPaid(true);
            addToast({ 
                title: "Payment Successful", 
                desc: isGuest ? "Guest ticket generated!" : "Ticket generated! Trust points recorded.", 
                emoji: "🎟️" 
            });
            window.dispatchEvent(new CustomEvent('trigger-confetti'));
        } catch (e: any) {
            addToast({ title: "Payment Error", desc: e.message, emoji: "😥" });
        } finally {
            setPaying(false);
        }
    };

    const handleDragDebtors = async () => {
        // Simulating the "Drag" action (Admin function)
        addToast({ title: 'Summoning Aunty Cashflow...', desc: 'Applying social pressure to debtors.', emoji: '😤' });
        
        try {
            // Mock call to send reminders
            // In a real app, this would hit an endpoint like /api/event/drag
            await remindAjoMember(pool.id, 'mock-debtor-1', 'sms', 'Your Aso-ebi money never land o. We dey wait.', 'strict');
            await remindAjoMember(pool.id, 'mock-debtor-2', 'whatsapp', 'Oga, pay up. People dey ask.', 'strict');
            
            setTimeout(() => {
                addToast({ title: 'Draging Complete', desc: 'Reminders sent to 3 pending members.', emoji: '🚀' });
            }, 1500);
        } catch (e) {
            addToast({ title: 'Error', desc: 'Could not drag debtors.', emoji: '😥' });
        }
    };

    if (paid) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-brand-100 shadow-xl space-y-6 animate-fade-in-up text-center">
                <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-5xl">
                    🎉
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
                    <p className="text-gray-500 mt-1">You are all set for {pool.name}.</p>
                </div>
                
                <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl w-full max-w-xs">
                    <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">PICK-UP TICKET</div>
                    <div className="h-48 w-48 bg-white mx-auto flex items-center justify-center rounded-lg border">
                        {/* Placeholder QR Code */}
                        <div className="grid grid-cols-5 gap-1 p-2 opacity-80">
                            {Array.from({length: 25}).map((_, i) => (
                                <div key={i} className={`w-6 h-6 ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}></div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 font-mono font-bold text-lg tracking-widest text-slate-700">
                        {pool.id.slice(0, 8).toUpperCase()}-TIK
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Show this code at the venue to collect your items.</p>
                </div>

                <button onClick={() => setPaid(false)} className="text-brand text-sm hover:underline">
                    Make another payment
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <h2 className="text-2xl font-bold">{pool.name}</h2>
                    <button 
                        onClick={() => setShowShareModal(true)} 
                        className="bg-white/20 backdrop-blur hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
                        Share
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-indigo-100 relative z-10">
                    <div className="flex items-center gap-1">
                        <span>📅</span> {new Date(settings.eventDate).toDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                        <span>📍</span> {settings.venue}
                    </div>
                </div>
                
                {/* Credit Mode Indicator */}
                {settings.allowCredit && (
                    <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg w-fit text-xs font-medium">
                        <span className="text-emerald-300">✓</span>
                        Deliver First, Pay Later Enabled
                    </div>
                )}
            </div>

            {/* Debt Status Banner (Only in Credit Mode & Authenticated) */}
            {settings.allowCredit && isAuthenticated && currentDebt > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex justify-between items-center animate-pulse-slow">
                    <div>
                        <div className="text-xs font-bold text-rose-800 uppercase tracking-wide">Outstanding Balance</div>
                        <div className="text-xl font-bold text-rose-900">₦{(currentDebt/100).toLocaleString()}</div>
                        <div className="text-xs text-rose-700 mt-1">You have collected items but not fully paid.</div>
                    </div>
                    <button 
                        onClick={() => {
                            // Auto-select unpaid collected items logic could go here
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700"
                    >
                        Pay Debt
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Select Items</h3>
                    {settings.allowCredit && <span className="text-xs text-gray-500 italic">Tick box if collected</span>}
                </div>
                
                <div className="space-y-2">
                    {settings.items.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => toggleItem(item.id)}
                            className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedItems.has(item.id) ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50 border-slate-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Selection Circle */}
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedItems.has(item.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                    {selectedItems.has(item.id) && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </div>
                                
                                <div>
                                    <span className={`block ${selectedItems.has(item.id) ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{item.name}</span>
                                    {/* Collected Badge */}
                                    {settings.allowCredit && collectedItems.has(item.id) && (
                                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-200 font-medium">
                                            📦 Collected
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-sm">₦{(item.price_kobo/100).toLocaleString()}</span>
                                
                                {/* Collection Checkbox (Credit Mode Only) */}
                                {settings.allowCredit && (
                                    <div 
                                        className="flex flex-col items-center border-l pl-3" 
                                        onClick={(e) => toggleCollected(item.id, e)}
                                    >
                                        <label className="text-[9px] text-gray-400 uppercase font-bold mb-1">Got it?</label>
                                        <input 
                                            type="checkbox" 
                                            checked={collectedItems.has(item.id)} 
                                            readOnly // Controlled by onClick
                                            className={`w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer ${!isAuthenticated ? 'opacity-50' : ''}`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Cash Gift (Optional)</label>
                    <input 
                        type="number" 
                        value={customAmount || ''} 
                        onChange={e => setCustomAmount(Number(e.target.value))}
                        placeholder="Amount in Naira" 
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                    />
                </div>
            </div>

            {/* Organizer Controls (Mock Admin View) */}
            {settings.allowCredit && isOrganizer && (
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 shadow-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <span className="text-xl">👮‍♂️</span> Organizer Panel
                        </h3>
                        <span className="bg-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-400">Admin View</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-400 uppercase">Items Distributed</div>
                            <div className="text-xl font-bold text-emerald-400">145</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                            <div className="text-xs text-slate-400 uppercase">Outstanding Debt</div>
                            <div className="text-xl font-bold text-rose-400">₦4.5M</div>
                        </div>
                    </div>
                    <button 
                        onClick={handleDragDebtors}
                        className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-rose-900/50 hover:from-rose-500 hover:to-orange-500 transition transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>📢</span> Drag Debtors (AI Nudge)
                    </button>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        This sends "friendly but strict" reminders to everyone who has collected items but not paid.
                    </p>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:static md:bg-transparent md:border-0 md:p-0 z-20">
                <button 
                    onClick={handlePayClick}
                    disabled={paying || totalPayableKobo <= 0}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-xl hover:bg-slate-800 disabled:opacity-50 transition transform active:scale-95"
                >
                    {paying ? 'Processing...' : `Pay ₦${(totalPayableKobo/100).toLocaleString()}`}
                </button>
            </div>

            {showUpsell && (
                <TrustUpsellModal 
                    amountKobo={totalPayableKobo}
                    onRegister={() => setPage('auth')}
                    onGuestPay={() => processPayment(true)}
                    onClose={() => setShowUpsell(false)}
                />
            )}

            {showShareModal && (
                <ShareModal 
                    title={pool.name}
                    shareId={pool.id}
                    type="event"
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default EventPotDetails;
