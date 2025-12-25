
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export type ModelChoice = 'gemini'|'openai';

export interface GenerateArgs { system: string; prompt: string; json?: boolean; }

export class AIClient {
  model: ModelChoice;
  constructor(model: ModelChoice = 'gemini') { this.model = model; }
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
