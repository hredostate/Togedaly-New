
import { GoogleGenAI, Type } from "@google/genai";
import type { AdviserTip, LegacyPool as Pool, RevenueEvent, SupportTicketMessage } from '../types';
import { searchKnowledgeBase } from './ragService';
import { getUserProfileContext } from './profileService';

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. AI features will not work.");
}

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _ai;
}

// Helper to sanitize JSON output from the model
function cleanJson(text: string): string {
    if (!text) return "{}";
    let clean = text.trim();
    
    // Aggressively remove markdown code blocks
    clean = clean.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');

    // Attempt to extract the outermost JSON object or array
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    // Determine if we are looking for an object or an array
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        const lastBrace = clean.lastIndexOf('}');
        if (lastBrace > firstBrace) {
            return clean.substring(firstBrace, lastBrace + 1);
        }
    } else if (firstBracket !== -1) {
        const lastBracket = clean.lastIndexOf(']');
        if (lastBracket > firstBracket) {
            return clean.substring(firstBracket, lastBracket + 1);
        }
    }

    return clean;
}

const toastPrompts = {
    JOIN_SUCCESS: "The user just successfully contributed to a group investment pool. Give them a short, witty, celebratory toast in Nigerian Pidgin English.",
    VOTE_CAST: "The user just cast their vote on a milestone for a group investment. Give them a short,witty toast in Nigerian Pidgin English about doing their civic duty as an investor.",
    GENERIC_ERROR: "Something went wrong with the user's action. Give them a short, funny, encouraging message in Nigerian Pidgin English, telling them to try again.",
    BADGE_EARNED: "The user just earned a new badge for their achievements on the platform. Give them a short, witty, celebratory toast in Nigerian Pidgin English.",
    LEVEL_UP: "The user just leveled up on the platform by gaining XP. Give them a short, witty, celebratory toast in Nigerian Pidgin English about their new level.",
    TRUST_INCREASE: "The user just got a trust score increase for a positive action (like paying on time). Give them a short, witty, celebratory toast in Nigerian Pidgin English about building trust."
};

export async function getNaijaToast(action: keyof typeof toastPrompts, context?: string): Promise<{title: string, desc: string, emoji: string}> {
  const ai = getAI();
  if (!ai) {
    return { title: 'Action complete!', desc: 'Your request was processed.', emoji: '👍' };
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${toastPrompts[action]} ${context ? `Context: ${context}`: ''}`,
        config: {
            systemInstruction: "You are a witty Nigerian friend. Give short, funny 'toasts' for financial actions. Use Pidgin English. ALWAYS return valid JSON with 'title', 'desc', and 'emoji'. Keep descriptions under 20 words.",
            responseMimeType: "application/json",
            maxOutputTokens: 2000, // Increased to prevent truncated JSON
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING },
                    emoji: { type: Type.STRING },
                }
            }
        }
    });
    
    const jsonString = cleanJson(response.text || "{}");
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn("JSON Parse Error in getNaijaToast (falling back):", e);
        // Fallback if parsing fails
        return { title: 'Success!', desc: 'Action completed successfully.', emoji: '👍' };
    }

  } catch (error) {
    console.error('Error fetching Naija Toast:', error);
    return { title: 'Wahala!', desc: 'Omo, something cast. Try again.', emoji: '⚠️' };
  }
}

export async function getAdviserFeed(): Promise<AdviserTip[]> {
    const ai = getAI();
    if (!ai) {
        return [
            { title: 'API Key Missing', description: 'Please set up your Gemini API key to receive financial advice.', category: 'Setup' },
        ];
    }
    
    // Inject Profile Context
    const profileContext = getUserProfileContext();
    
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 3 diverse, short, and actionable financial tips for this user.
            
            ${profileContext ? `CONSIDER THIS USER PROFILE:\n${profileContext}\n\n` : ''}
            
            Include:
            1. One tip related to their specific profile data if available (e.g. rent, car, japa plans).
            2. One general tip on saving/investing.
            3. One tip on avoiding scams or bad debt.
            
            Keep descriptions under 25 words.`,
            config: {
                systemInstruction: "You are a friendly Nigerian financial adviser named 'Adviser T'. Provide short, actionable financial tips. Use simple language. Return a JSON array of objects with 'title', 'description', and 'category'.",
                responseMimeType: "application/json",
                maxOutputTokens: 3000, 
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            category: { type: Type.STRING, description: "e.g., Savings, Investing, Side Hustle" }
                        }
                    }
                }
            }
        });

        const jsonString = cleanJson(response.text || "[]");
        
        try {
            const data = JSON.parse(jsonString);
            return data as AdviserTip[];
        } catch (parseError) {
            console.warn("Adviser feed JSON parse failed, returning fallback.", parseError);
            return [
                { title: "Stay Consistent", description: "Consistency is key to financial growth. Keep saving regularly.", category: "Savings" },
                { title: "Avoid Bad Debt", description: "Only borrow for things that increase in value or generate income.", category: "Education" },
                { title: "Verify Before You Pay", description: "Always confirm recipient details before making transfers.", category: "Security" }
            ];
        }
    } catch (error) {
        console.error("Error fetching adviser feed:", error);
        return [{
            title: "Could Not Fetch Advice",
            description: "There was an issue connecting to the AI adviser. Please check your connection or API key.",
            category: "Error"
        }];
    }
}

export async function getPoolInsight(pool: Pool, question: string): Promise<string> {
    const ai = getAI();
    if (!ai) {
        return "AI features are currently unavailable. Please check the API key configuration.";
    }
    if (!question.trim()) {
        return "Please ask a question.";
    }

    try {
        const poolContext = `
            Title: ${pool.name}
            Type: ${pool.poolType}
            Description: ${pool.description}
            Target Amount (Naira): ${pool.base_amount_kobo / 100}
            Raised Amount (Naira): ${pool.raised_amount_kobo / 100}
            Minimum Contribution (Naira): ${pool.min_contribution_kobo / 100}
            Is Open for Investment: ${pool.is_active}
            Milestones: ${pool.milestones.map(m => `- ${m.title} (${m.status})`).join('\n') || 'None'}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Question: "${question}"\n\nPool Details:\n${poolContext}`,
            config: {
                maxOutputTokens: 800,
                systemInstruction: "You are an AI financial assistant for 'Togedaly'. Your tone is savvy, encouraging, and Nigerian. Provide insights based ONLY on the data provided. Frame answers with phrases like 'Based on the details provided...'. Keep responses concise (under 150 words).",
            }
        });

        return response.text ? response.text.trim() : "No response generated.";
    } catch (error) {
        console.error("Error fetching pool insight:", error);
        return "Omo, I no fit answer that one right now. My brain just hang. Try ask again later.";
    }
}


export async function getRevenueDigest(events: RevenueEvent[]): Promise<string> {
    const ai = getAI();
    if (!ai) {
        return "Your weekly payout summary is ready. Check your pools for details.";
    }
    if (events.length === 0) {
        return "No payout activity this week, but keep pushing! The next big win is just around the corner.";
    }

    const context = events.map(e => `- Pool ID ${e.pool_id.substring(0, 8)} paid out ₦${(e.total_revenue_kobo / 100).toLocaleString()}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Here are the user's pool payouts from this week:\n${context}`,
            config: {
                maxOutputTokens: 500,
                systemInstruction: "You are 'Adviser T', a witty Nigerian financial adviser. Summarize the user's weekly pool payouts in a single, short, encouraging, and celebratory paragraph. Use some light, positive pidgin. Focus on the total number of pools that paid out.",
            }
        });
        return response.text ? response.text.trim() : "Digest generation failed.";
    } catch (error) {
        console.error("Error fetching revenue digest:", error);
        return "Great work this week! Your investments are paying off. Check your wallet for the latest payouts.";
    }
}

export async function getTicketSummary(messages: Pick<SupportTicketMessage, 'body' | 'is_admin'>[]): Promise<string> {
    const ai = getAI();
    if (!ai) {
        return "AI features are currently unavailable. Please check the API key configuration.";
    }
    if (messages.length === 0) {
        return "No conversation to summarize.";
    }

    try {
        const conversationContext = messages
            .map(m => `${m.is_admin ? 'Admin' : 'User'}: ${m.body}`)
            .join('\n---\n');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Conversation:\n${conversationContext}`,
            config: {
                maxOutputTokens: 500,
                systemInstruction: "You are an AI assistant. Summarize a support ticket conversation concisely. Identify the user's problem and current status. Use bullet points. Max 100 words.",
            }
        });

        return response.text ? response.text.trim() : "Summary unavailable.";
    } catch (error) {
        console.error("Error fetching ticket summary:", error);
        return "Could not generate a summary for this ticket.";
    }
}

export async function chatWithAI(userId: string, query: string): Promise<string> {
    const ai = getAI();
    if (!ai) return "Service is offline (Missing API Key).";

    try {
        const contextChunks = await searchKnowledgeBase(query, userId);
        
        // Add profile context
        const profileStr = getUserProfileContext();
        
        const contextString = `
        ${profileStr ? profileStr + '\n\n' : ''}
        DOCS & HISTORY:
        ${contextChunks.length > 0 ? contextChunks.join("\n\n") : "No specific history docs found."}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Query: ${query}`,
            config: {
                maxOutputTokens: 600,
                systemInstruction: `You are 'Adviser T', Togedaly's smart financial assistant.
                Tone: Professional but accessible, with a touch of Nigerian warmth.
                Goal: Answer the user's question accurately using the retrieved context below.
                
                RETRIEVED CONTEXT:
                ${contextString}
                
                Instructions:
                - If profile attributes are present, customize the answer (e.g. if they pay monthly rent, suggest pools that payout monthly).
                - If the context answers the question, explain it clearly.
                - If context is irrelevant, answer generally about Togedaly features but admit limitations.
                - Be concise (under 3 sentences).
                - Do NOT hallucinate financial status.
                `
            }
        });

        return response.text ? response.text.trim() : "No response from AI.";
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "Eyah, network wan fall my hand. Can you ask that again?";
    }
}

export async function getSuggestedMilestones(name: string, description: string, amount: number): Promise<{title: string, amount: number}[]> {
    const ai = getAI();
    if (!ai) return [];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a project manager. Create a list of 3-5 financial milestones for a venture named "${name}".
            Context: ${description}
            Total Goal: ${amount}
            
            Return a JSON array of objects with keys:
            - title: string (short milestone name)
            - amount: number (cost for this phase)
            
            The sum of amounts should equal ${amount}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                        }
                    }
                }
            }
        });
        
        const jsonString = cleanJson(response.text || "[]");
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("AI Milestone Gen Error:", e);
        return [];
    }
}

// --- NEW AI FEATURES ---

// 1. Magic Paste / Form Filling
export async function parsePoolDetails(text: string): Promise<any> {
    const ai = getAI();
    if (!ai) return {};
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract pool details from this text: "${text}"`,
            config: {
                systemInstruction: "You are an AI data extractor. Extract the following fields: name, description, amount (number only), frequency ('weekly' or 'monthly'), type ('ajo', 'group_buy', 'invest'). If a field is missing, omit it or use a sensible default based on context. Return strictly JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        amount: { type: Type.NUMBER },
                        frequency: { type: Type.STRING, enum: ['weekly', 'monthly'] },
                        type: { type: Type.STRING, enum: ['ajo', 'group_buy', 'invest', 'event', 'waybill'] }
                    }
                }
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Form parsing error", e);
        return {};
    }
}

// 2. Semantic Navigation / Intent Recognition
export async function interpretCommand(query: string): Promise<{ action: string, page?: string, context?: any }> {
    const ai = getAI();
    if (!ai) return { action: 'unknown' };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Interpret user command: "${query}"`,
            config: {
                systemInstruction: `You are a navigation assistant for the Togedaly app. Map the user's intent to one of the following pages:
                - 'dashboard' (Home, Overview)
                - 'wallet' (Add money, balance, withdraw)
                - 'explore' (Find pools, join ajo, browse)
                - 'standing' (Credit score, trust score, history)
                - 'notifications' (Settings, profile)
                - 'kyc' (Verify identity)
                - 'loanRequest' (Get a loan, refinance)
                - 'owambe' (Party mode, spray money)
                
                Return JSON with 'page' and optional 'context' (e.g., filter for explore).`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        page: { type: Type.STRING },
                        context: { type: Type.OBJECT, properties: { filter: { type: Type.STRING } } }
                    }
                }
            }
        });
        const result = JSON.parse(cleanJson(response.text || "{}"));
        return { action: 'navigate', ...result };
    } catch (e) {
        return { action: 'unknown' };
    }
}

// 3. Voice Intent Parsing (for Owambe)
export async function parseVoiceSpray(transcript: string): Promise<{ amount: number, confirm: boolean }> {
    const ai = getAI();
    if (!ai) return { amount: 0, confirm: false };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract spray amount from: "${transcript}"`,
            config: {
                systemInstruction: "User is at a party wanting to spray money. Extract the amount in Naira. Return JSON { amount: number }. If unclear, return amount: 0.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.NUMBER }
                    }
                }
            }
        });
        const result = JSON.parse(cleanJson(response.text || "{}"));
        return { amount: result.amount || 0, confirm: true };
    } catch (e) {
        return { amount: 0, confirm: false };
    }
}
