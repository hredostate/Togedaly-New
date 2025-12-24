
import type { ProfileQuestion, UserAttribute } from '../types';

// Mock Question Bank
const questions: ProfileQuestion[] = [
    {
        id: 'q_rent',
        question: "How do you usually pay your house rent?",
        options: ["Annually (Bulk)", "Bi-Annually", "Monthly", "I own my home"],
        category: 'finance',
        gamification: { xp: 15, successMsg: "Noted! Rent is a big one." }
    },
    {
        id: 'q_car',
        question: "Do you own a car or are you planning to buy one soon?",
        options: ["Own a car", "Planning to buy", "No, I use Uber/Public", "No interest"],
        category: 'lifestyle',
        gamification: { xp: 10, successMsg: "Vroom vroom! 🚗" }
    },
    {
        id: 'q_risk',
        question: "If you see a new investment with high returns but high risk, you...",
        options: ["Put all my money!", "Put small money", "Research first", "Run away"],
        category: 'risk',
        gamification: { xp: 20, successMsg: "Risk profile updated." }
    },
    {
        id: 'q_japa',
        question: "Is 'Japa' (relocating abroad) in your 2-year plan?",
        options: ["Yes, actively saving", "Maybe, if opportunity comes", "No, I love Naija", "Already abroad"],
        category: 'goals',
        gamification: { xp: 15, successMsg: "We hear you. ✈️" }
    },
    {
        id: 'q_dependents',
        question: "Do you have people who depend on your income (Black Tax)?",
        options: ["Yes, heavily", "Yes, a little", "No, just me"],
        category: 'finance',
        gamification: { xp: 10, successMsg: "Strength to you! 💪" }
    }
];

// Mock persistence in localStorage for this demo
const STORAGE_KEY = 'user_profile_attributes';
const LAST_ASKED_KEY = 'profile_last_asked_at';

export async function getNextQuestion(): Promise<ProfileQuestion | null> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 400));

    // 1. Check Cooldown (e.g., 2 minutes for demo, real world maybe 1 day)
    const lastAsked = localStorage.getItem(LAST_ASKED_KEY);
    if (lastAsked) {
        const diff = Date.now() - parseInt(lastAsked, 10);
        // For demo: 10 seconds cooldown. For prod: 24 * 60 * 60 * 1000
        if (diff < 10000) return null; 
    }

    // 2. Get Answered IDs
    const stored = localStorage.getItem(STORAGE_KEY);
    const attributes: UserAttribute[] = stored ? JSON.parse(stored) : [];
    const answeredIds = new Set(attributes.map(a => a.questionId));

    // 3. Find next
    const next = questions.find(q => !answeredIds.has(q.id));
    return next || null;
}

export async function saveAnswer(questionId: string, answer: string): Promise<void> {
    await new Promise(r => setTimeout(r, 300));
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const attributes: UserAttribute[] = stored ? JSON.parse(stored) : [];
    
    // Upsert
    const existingIdx = attributes.findIndex(a => a.questionId === questionId);
    const newAttr: UserAttribute = { questionId, answer, answeredAt: new Date().toISOString() };
    
    if (existingIdx > -1) {
        attributes[existingIdx] = newAttr;
    } else {
        attributes.push(newAttr);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(attributes));
    localStorage.setItem(LAST_ASKED_KEY, Date.now().toString());
}

export function getUserProfileContext(): string {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return "";
    
    const attributes: UserAttribute[] = JSON.parse(stored);
    
    // Convert to readable text for AI
    // e.g. "Rent: Monthly", "Car: Planning to buy"
    const contextLines = attributes.map(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q ? `- ${q.category.toUpperCase()}: ${q.question} -> Answer: "${a.answer}"` : "";
    }).filter(Boolean);

    if (contextLines.length === 0) return "";

    return `
USER PROFILE ATTRIBUTES (Self-Reported):
${contextLines.join('\n')}
    `.trim();
}
