
import React, { useState, useEffect } from 'react';
import { getNextQuestion, saveAnswer } from '../../services/profileService';
import type { ProfileQuestion } from '../../types';
import { useToasts } from '../ToastHost';
import { awardXp } from '../../services/gamificationService';

export const ProfileBuilderCard: React.FC = () => {
    const [question, setQuestion] = useState<ProfileQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const { add: addToast } = useToasts();

    useEffect(() => {
        // Delay load to not block initial paint
        const timer = setTimeout(async () => {
            const q = await getNextQuestion();
            setQuestion(q);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleAnswer = async (answer: string) => {
        if (!question) return;
        
        // Optimistic hide
        setQuestion(null); 
        
        try {
            await saveAnswer(question.id, answer);
            
            // Gamification reward
            await awardXp(question.gamification.xp, "Profile Building");
            addToast({ 
                title: question.gamification.successMsg, 
                desc: `+${question.gamification.xp} XP Earned!`, 
                emoji: '🌟' 
            });
            window.dispatchEvent(new CustomEvent('trigger-confetti'));
        } catch (e) {
            console.error("Failed to save answer", e);
        }
    };

    if (loading || !question || dismissed) return null;

    return (
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-lg relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🤔</span>
                        <h3 className="font-bold text-sm uppercase tracking-wide opacity-90">Togedaly Trivia</h3>
                    </div>
                    <button onClick={() => setDismissed(true)} className="text-white/50 hover:text-white transition">✕</button>
                </div>

                <p className="font-bold text-lg mb-4 leading-tight">
                    {question.question}
                </p>

                <div className="grid grid-cols-2 gap-2">
                    {question.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt)}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl py-2 px-3 text-sm font-medium text-left transition active:scale-95"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                
                <div className="mt-3 text-[10px] opacity-70 text-center">
                    Answer to help Adviser T know you better + earn XP!
                </div>
            </div>
        </div>
    );
};
