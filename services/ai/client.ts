
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// ⚠️ SECURITY WARNING: API keys exposed client-side via VITE_* environment variables
// VITE_API_KEY and VITE_OPENAI_API_KEY are visible in the browser bundle
// This is NOT suitable for production use as API keys can be extracted and abused
//
// TODO: Move AI operations to Next.js API routes for production
// Create server-side endpoints that:
// - Store API keys securely in server environment variables (without VITE_ prefix)
// - Implement rate limiting per user
// - Add request validation and sanitization
// - Monitor and log API usage
//
// Example: Create /app/api/ai/generate/route.ts that handles AI calls server-side

export type ModelChoice = 'gemini'|'openai';

export interface GenerateArgs { system: string; prompt: string; json?: boolean; }

export class AIClient {
  model: ModelChoice;
  constructor(model: ModelChoice = 'gemini') { 
    this.model = model;
    // Runtime warning about client-side API key exposure
    if (typeof window !== 'undefined') {
      console.warn('⚠️ WARNING: AI API keys exposed client-side. Move to server-side API routes for production.');
    }
  }
  async generate({ system, prompt, json }: GenerateArgs): Promise<string> {
    if (this.model === 'gemini') {
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiKey) throw new Error('VITE_API_KEY is not set');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: system,
            ...(json && { responseMimeType: 'application/json' }),
        }
      });
      return response.text || '';
    } else {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set');
      const client = new OpenAI({ apiKey });
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ],
        response_format: json ? { type: 'json_object' } : undefined
      });
      return r.choices[0].message?.content || '';
    }
  }
}
