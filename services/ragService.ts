
import { GoogleGenAI } from "@google/genai";
import { mockAjoPayments, mockUserProfiles } from '../data/ajoMockData';
import { mockDefaultEvents } from '../data/standingMockData';
import { mockUserRiskProfiles } from '../data/riskMockData';
import { mockLegacyPools } from '../data/mockData';

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

interface DocChunk {
    id: string;
    text: string;
    metadata: { type: 'policy' | 'user_history' | 'pool_info'; refId?: string };
    vector?: number[];
}

// --- Static Help Center Content ---
const helpDocs: DocChunk[] = [
    {
        id: 'pol-withdraw-1',
        text: 'Withdrawals of collateral are only permitted if the user has no outstanding missed payments in any active pool. If a payment is missed, collateral is locked until the debt is settled.',
        metadata: { type: 'policy' }
    },
    {
        id: 'pol-withdraw-2',
        text: 'To withdraw collateral, navigate to the Pool Details page. If eligible, the "Withdraw" button will be active. Withdrawals are processed instantly to your wallet.',
        metadata: { type: 'policy' }
    },
    {
        id: 'pol-trust-1',
        text: 'Trust Score is calculated based on on-time payments, peer reviews, and identity verification (KYC). A score below 50 may restrict access to high-value pools.',
        metadata: { type: 'policy' }
    },
    {
        id: 'pol-penalty-1',
        text: 'Late payments incur a penalty fee. If a payment is more than 7 days late, the user enters a "Default" state and collateral may be liquidated to cover the cost.',
        metadata: { type: 'policy' }
    },
    {
        id: 'pol-kyc-1',
        text: 'KYC Verification tiers: Basic (Phone), Plus (BVN), and Pro (Government ID). Higher tiers unlock higher withdrawal limits.',
        metadata: { type: 'policy' }
    }
];

// --- Vector Utils ---

async function getEmbedding(text: string): Promise<number[] | null> {
    if (!ai) return null;
    try {
        const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: { parts: [{ text }] }
        });
        return result.embeddings?.[0]?.values || null;
    } catch (e) {
        console.warn("Embedding failed", e);
        return null;
    }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB);
}

// --- Data Aggregation ---

async function buildUserContext(userId: string): Promise<DocChunk[]> {
    const chunks: DocChunk[] = [];

    // 1. Payment History
    const payments = mockAjoPayments.filter(p => p.user_id === userId);
    payments.forEach(p => {
        const status = p.paid_at ? (new Date(p.paid_at) <= new Date(p.due_date) ? 'Paid on time' : 'Paid late') : (new Date() > new Date(p.due_date) ? 'Missed/Overdue' : 'Upcoming');
        const poolName = mockLegacyPools.find(l => l.id === p.group_id)?.name || 'Unknown Pool';
        chunks.push({
            id: `hist-pay-${p.id}`,
            text: `Payment for ${poolName} (Amount: ₦${p.amount_kobo/100}) due on ${p.due_date}. Status: ${status}.`,
            metadata: { type: 'user_history', refId: String(p.id) }
        });
    });

    // 2. Defaults/Penalties
    const defaults = mockDefaultEvents.filter(d => d.user_id === userId);
    defaults.forEach(d => {
        chunks.push({
            id: `hist-def-${d.id}`,
            text: `Recorded a default event on ${d.created_at}. State: ${d.state}. Penalty charged: ₦${d.penalty_amount}.`,
            metadata: { type: 'user_history', refId: d.id }
        });
    });

    // 3. Risk/Profile
    const profile = mockUserRiskProfiles.find(p => p.user_id === userId);
    if (profile) {
        chunks.push({
            id: `hist-risk-${userId}`,
            text: `User Trust Score is ${profile.risk_all} (Risk Index). KYC Status is ${profile.status}.`,
            metadata: { type: 'user_history' }
        });
    }

    return chunks;
}

// --- Main RAG Function ---

export async function searchKnowledgeBase(query: string, userId: string): Promise<string[]> {
    // 1. Aggregate Documents
    const userDocs = await buildUserContext(userId);
    const allDocs = [...helpDocs, ...userDocs];

    // 2. If no API key, fallback to simple keyword matching
    if (!ai) {
        console.log("RAG: No API Key, using keyword fallback.");
        const terms = query.toLowerCase().split(' ');
        const scored = allDocs.map(doc => {
            const score = terms.reduce((acc, term) => acc + (doc.text.toLowerCase().includes(term) ? 1 : 0), 0);
            return { doc, score };
        });
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.doc.text);
    }

    // 3. Vector Search
    try {
        const queryVector = await getEmbedding(query);
        if (!queryVector) throw new Error("Could not embed query");

        // In a real app, doc vectors would be pre-computed and stored in DB.
        // Here we compute them on the fly for the demo (slow but functional for small N).
        const scoredDocs = await Promise.all(allDocs.map(async doc => {
            // Simple caching strategy for the session could go here
            const vec = await getEmbedding(doc.text); 
            if (!vec) return { doc, score: -1 };
            return { doc, score: cosineSimilarity(queryVector, vec) };
        }));

        const results = scoredDocs
            .filter(s => s.score > 0.4) // Similarity threshold
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.doc.text);
            
        console.log("RAG Retrieved:", results);
        return results;

    } catch (e) {
        console.error("RAG Error:", e);
        return []; // Fail gracefully
    }
}
