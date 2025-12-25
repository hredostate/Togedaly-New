
import React, { useState, useEffect } from 'react';
import { useToasts } from '../ToastHost';

type Mood = 'sapa' | 'managing' | 'okay' | 'soft' | 'odogwu';

const MOODS: { id: Mood; emoji: string; label: string; response: string }[] = [
    { id: 'sapa', emoji: '😫', label: 'Sapa', response: "Eyah. Sapa nice one? Breathe. We go run am. Check 'Side Hustle' tips." },
    { id: 'managing', emoji: '😐', label: 'De Manage', response: "We move. Consistent deposits today = soft life tomorrow." },
    { id: 'okay', emoji: '🙂', label: 'E dey go', response: "Normal level. Keep the focus, no distract." },
    { id: 'soft', emoji: '😎', label: 'Soft', response: "I see you! Things are aligning. Make sure you invest that extra change o." },
    { id: 'odogwu', emoji: '🤑', label: 'Odogwu', response: "Opoooor! Cut soap for us na? 🧼 Time to top up that Ajo slot!" },
];

export const MoodTracker: React.FC<{ userId: string }> = ({ userId }) => {
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [history, setHistory] = useState<Mood[]>([]);
    const { add: addToast } = useToasts();

    useEffect(() => {
        // Check if already logged today
        const today = new Date().toDateString();
        const lastLog = localStorage.getItem(`mood_last_log_date_${userId}`);
        const storedMood = localStorage.getItem(`mood_today_${userId}`);
        
        if (lastLog === today && storedMood) {
            setSelectedMood(storedMood as Mood);
        }

        // Load mock history for visualization
        const savedHistory = JSON.parse(localStorage.getItem(`mood_history_${userId}`) || '[]');
        if (savedHistory.length === 0) {
            // Seed fake history if empty for better UX demo
            setHistory(['managing', 'okay', 'sapa', 'okay', 'soft']);
        } else {
            setHistory(savedHistory);
        }
    }, [userId]);

    const handleSelect = (mood: typeof MOODS[0]) => {
        if (selectedMood) return; // Already logged

        setSelectedMood(mood.id);
        localStorage.setItem(`mood_today_${userId}`, mood.id);
        localStorage.setItem(`mood_last_log_date_${userId}`, new Date().toDateString());
        
        // Update history
        const newHistory = [...history, mood.id].slice(-6); // Keep last 7
        setHistory(newHistory);
        localStorage.setItem(`mood_history_${userId}`, JSON.stringify(newHistory));

        // Trigger reaction
        addToast({
            title: `Vibe Check: ${mood.label}`,
            desc: mood.response,
            emoji: mood.emoji,
            timeout: 6000
        });

        if (mood.id === 'odogwu' || mood.id === 'soft') {
            window.dispatchEvent(new CustomEvent('trigger-confetti'));
        }
    };

    return (
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-400 to-purple-500"></div>
            
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        Daily Vibe Check
                        {selectedMood && <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>}
                    </h3>
                    <p className="text-xs text-gray-500">How's your money feeling today?</p>
                </div>
                {/* Mini History Visualization */}
                <div className="flex gap-1 items-end h-6">
                    {history.map((m, i) => {
                        const height = m === 'odogwu' ? '100%' : m === 'soft' ? '80%' : m === 'okay' ? '60%' : m === 'managing' ? '40%' : '20%';
                        const color = m === 'odogwu' || m === 'soft' ? 'bg-emerald-400' : m === 'sapa' ? 'bg-rose-300' : 'bg-slate-300';
                        return <div key={i} className={`w-1.5 rounded-t-sm ${color}`} style={{ height }}></div>;
                    })}
                </div>
            </div>

            {!selectedMood ? (
                <div className="flex justify-between items-center gap-2">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.id}
                            onClick={() => handleSelect(mood)}
                            className="group flex flex-col items-center gap-1 flex-1 transition-transform active:scale-95 hover:-translate-y-1"
                        >
                            <div className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                                {mood.emoji}
                            </div>
                            <span className="text-[10px] font-medium text-gray-400 group-hover:text-brand-600">{mood.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 animate-fade-in-up">
                    <div className="text-4xl bg-white rounded-full p-1 shadow-sm">
                        {MOODS.find(m => m.id === selectedMood)?.emoji}
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                            {MOODS.find(m => m.id === selectedMood)?.response}
                        </div>
                        <div className="text-xs text-brand-600 mt-1 font-semibold">
                            ~ Adviser T
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
