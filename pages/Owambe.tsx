
import React, { useState, useEffect, useRef } from 'react';
import type { Page } from '../App';
import { useToasts } from '../components/ToastHost';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { parseVoiceSpray } from '../services/geminiService';

interface OwambeProps {
    setPage: (page: Page) => void;
}

interface SprayEvent {
    id: number;
    sender: string;
    amount: number;
    timestamp: number;
}

const presetAmounts = [500, 1000, 2000, 5000, 10000];

const Owambe: React.FC<OwambeProps> = ({ setPage }) => {
    const [mode, setMode] = useState<'celebrant' | 'guest'>('guest');
    const [totalSprayed, setTotalSprayed] = useState(0);
    const [feed, setFeed] = useState<SprayEvent[]>([]);
    const [guestAmount, setGuestAmount] = useState<number>(1000);
    const [isSpraying, setIsSpraying] = useState(false);
    const { add: addToast } = useToasts();
    
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    
    // Realtime refs
    const channelRef = useRef<RealtimeChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize Supabase Realtime
    useEffect(() => {
        const channel = supabase.channel('room-owambe', {
            config: {
                broadcast: { self: true }, // Receive own events for visual confirmation
            },
        });

        channel
            .on('broadcast', { event: 'spray' }, ({ payload }) => {
                handleIncomingSpray(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Setup Voice Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-NG'; // Nigerian English context

            recognitionRef.current.onresult = async (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setIsListening(false);
                addToast({ title: 'Heard', desc: `"${text}"`, emoji: '🎤' });
                
                // Process intent
                const { amount, confirm: isConfirmed } = await parseVoiceSpray(text);
                if (isConfirmed && amount > 0) {
                    setGuestAmount(amount);
                    if (window.confirm(`Voice Command: Spray ₦${amount.toLocaleString()}?`)) {
                        handleGuestSpray(amount);
                    }
                } else {
                    addToast({ title: 'Say again?', desc: "Couldn't hear an amount.", emoji: '👂' });
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                setIsListening(false);
                console.error("Speech error", event.error);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleMic = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    // Handle incoming spray (from self or others)
    const handleIncomingSpray = (payload: any) => {
        const { sender, amount, id } = payload;
        
        // Update Feed
        const newEvent = { id, sender, amount, timestamp: Date.now() };
        setFeed(prev => [newEvent, ...prev].slice(0, 8)); // Keep last 8
        setTotalSprayed(prev => prev + amount);

        // Effects (Only for Celebrant Mode to avoid noise on Guest phones)
        if (mode === 'celebrant') {
            // Haptic
            if (navigator.vibrate) {
                if (amount >= 10000) navigator.vibrate([100, 50, 100, 50, 200]); 
                else navigator.vibrate(100);
            }
            // Confetti for big amounts
            if (amount >= 5000) {
                window.dispatchEvent(new CustomEvent('trigger-confetti'));
            }
        }
    };

    // Fallback Simulation
    useEffect(() => {
        if (mode !== 'celebrant') return;
        if (isConnected) return; 

        const names = ["Chief Emeka", "Auntie Funke", "Dr. Tunde", "Mama Chi", "Odogwu 1"];
        const amounts = [1000, 5000, 10000, 20000];

        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const name = names[Math.floor(Math.random() * names.length)];
                const amt = amounts[Math.floor(Math.random() * amounts.length)];
                handleIncomingSpray({ sender: name, amount: amt, id: Date.now() });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [mode, isConnected]);


    const handleGuestSpray = async (amountOverride?: number) => {
        if (isSpraying) return;
        const amtToSpray = amountOverride || guestAmount;
        setIsSpraying(true);
        
        const payload = {
            id: Date.now(),
            sender: "Guest (You)", // In real app, get from Auth profile
            amount: amtToSpray
        };

        // 1. Broadcast to everyone (including self)
        if (channelRef.current) {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'spray',
                payload: payload
            });
        } else {
            // Fallback if offline
            handleIncomingSpray(payload);
        }
        
        // Mock payment processing delay
        await new Promise(r => setTimeout(r, 300));
        
        addToast({ title: 'Sprayed!', desc: `You sprayed ₦${amtToSpray.toLocaleString()} successfully!`, emoji: '💸' });
        setIsSpraying(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
            {/* Header / Mode Toggle */}
            <div className="p-4 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0 z-20">
                <button onClick={() => setPage('dashboard')} className="text-gray-300 hover:text-white">← Exit</button>
                
                <div className="flex flex-col items-center">
                    <div className="bg-slate-950 p-1 rounded-xl flex text-xs font-bold">
                        <button 
                            onClick={() => setMode('guest')}
                            className={`px-4 py-2 rounded-lg transition ${mode === 'guest' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Guest
                        </button>
                        <button 
                            onClick={() => setMode('celebrant')}
                            className={`px-4 py-2 rounded-lg transition ${mode === 'celebrant' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Celebrant
                        </button>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className="text-[9px] text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
                    </div>
                </div>
                
                <div className="w-8"></div>{/* Spacer */}
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Background FX */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Celebrant View: Big Numbers & Feed */}
                {mode === 'celebrant' && (
                    <div className="flex-1 flex flex-col items-center justify-center z-10 p-6 space-y-8">
                        <div className="text-center">
                            <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-2">Total Sprayed</div>
                            <div className="text-6xl font-black bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
                                ₦{totalSprayed.toLocaleString()}
                            </div>
                        </div>

                        <div className="w-full max-w-md space-y-3">
                            {feed.map((event) => (
                                <div key={event.id} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 animate-fade-in-up">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                                            {event.sender.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{event.sender}</div>
                                            <div className="text-xs text-gray-400">just now</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-emerald-400">
                                        +₦{event.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Guest View: Spray Controls */}
                {mode === 'guest' && (
                    <div className="flex-1 flex flex-col z-10">
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold">Make it Rain! 🌧️</h2>
                                <p className="text-gray-400 text-sm">Tap an amount or use Voice to spray.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {presetAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setGuestAmount(amt)}
                                        className={`p-4 rounded-2xl border-2 transition-all ${
                                            guestAmount === amt 
                                            ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="text-lg font-bold">₦{amt.toLocaleString()}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900 border-t border-white/10 flex gap-3">
                            <button 
                                onClick={toggleMic}
                                className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-rose-600 animate-pulse' : 'bg-slate-700'}`}
                            >
                                <span className="text-2xl">{isListening ? '🛑' : '🎤'}</span>
                            </button>
                            
                            <button
                                onClick={() => handleGuestSpray()}
                                disabled={isSpraying}
                                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-bold text-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {isSpraying ? (
                                    'Spraying...'
                                ) : (
                                    <>
                                        <span>💸</span> Spray ₦{guestAmount.toLocaleString()}
                                    </>
                                )}
                            </button>
                        </div>
                        {transcript && <div className="text-center text-xs text-gray-400 pb-2">Heard: "{transcript}"</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Owambe;
