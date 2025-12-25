
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export type ModelChoice = 'gemini'|'openai';

export interface GenerateArgs { system: string; prompt: string; json?: boolean; }

export class AIClient {
  model: ModelChoice;
  constructor(model: ModelChoice = 'gemini') { this.model = model; }
  async generate({ system, prompt, json }: GenerateArgs): Promise<string> {
    if (this.model === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [ { role: 'system', content: system }, { role: 'user', content: prompt } ],
        response_format: json ? { type: 'json_object' } : undefined
      });
      return r.choices[0].message?.content || '';
    }
  }
}
