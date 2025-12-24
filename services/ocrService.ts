
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:mime/type;base64, prefix to get raw base64
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

export interface ScannedReceipt {
    amount: number;
    currency: string;
    date: string;
    sender: string;
    receiver: string;
    status: string;
    ref: string;
}

export async function scanReceipt(file: File): Promise<ScannedReceipt> {
    if (!ai) throw new Error("AI not configured");
    
    const base64 = await fileToBase64(file);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: file.type, data: base64 } },
                { text: "Extract transaction details from this receipt image. If fields are missing, make a best guess or return null. Return JSON." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    amount: { type: Type.NUMBER, description: "The transaction amount" },
                    currency: { type: Type.STRING, description: "Currency code e.g. NGN" },
                    date: { type: Type.STRING, description: "Date of transaction in ISO format if possible" },
                    sender: { type: Type.STRING, description: "Name of the sender" },
                    receiver: { type: Type.STRING, description: "Name of the beneficiary" },
                    status: { type: Type.STRING, description: "Transaction status e.g. Successful" },
                    ref: { type: Type.STRING, description: "Transaction Reference Number" }
                }
            }
        }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
}

export interface SpendingAnalysis {
    categories: { name: string; amount: number }[];
    total_income: number;
    total_expense: number;
    safe_savings: number;
    advice: string;
}

export async function analyzeSpending(file: File): Promise<SpendingAnalysis> {
    if (!ai) throw new Error("AI not configured");
    
    const base64 = await fileToBase64(file);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: file.type, data: base64 } },
                { text: "Analyze this bank statement/transaction history. 1. Group expenses by category (Food, Transport, Data, etc.). 2. Calculate total income and expense. 3. Suggest a realistic monthly 'Ajo' savings amount based on disposable income. 4. Give a short, witty Nigerian-style piece of financial advice. Return JSON." }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    categories: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                name: { type: Type.STRING }, 
                                amount: { type: Type.NUMBER } 
                            } 
                        } 
                    },
                    total_income: { type: Type.NUMBER },
                    total_expense: { type: Type.NUMBER },
                    safe_savings: { type: Type.NUMBER },
                    advice: { type: Type.STRING }
                }
            }
        }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
}
