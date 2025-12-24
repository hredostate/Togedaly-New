// /app/api/coach/suggest/route.ts  (GET ?orgId=&userId=)
import { supabase as sb } from '../../../../supabaseClient';
import { buildCoachPrompt } from '../../../../lib/aiCoach/persona';
import { GoogleGenAI } from '@google/genai';
import type { HabitSummary } from '../../../../types';

// This is a placeholder for a Next.js environment.
export async function GET(req: { url: string }){
  const { searchParams } = new URL(req.url, 'http://localhost');
  const orgId = Number(searchParams.get('orgId'));
  const userId = String(searchParams.get('userId'));
  if(!orgId || !userId) return { status: 400, body: JSON.stringify({ error: 'orgId and userId required' }) };

  if (!process.env.API_KEY) {
      console.warn("API_KEY not set in suggest route");
      return { status: 500, body: JSON.stringify({ error: 'AI is not configured.' }) };
  }

  const genai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1) Refresh habits
  console.log('MOCK API: Simulating RPC call: recompute_user_habits');
  // const { error: rpcError } = await sb.rpc('recompute_user_habits', { p_org: orgId, p_user: userId, p_days: 14 });
  // if (rpcError) return { status: 500, body: JSON.stringify({ error: (rpcError as any).message }) };
  
  // MOCKING the result of the RPC call for client-side demo
  const { data: summaryRow, error: e1 } = await sb.from('user_habit_summary').select('*').eq('org_id', orgId).eq('user_id', userId).single();
  // if (e1) return { status: 400, body: JSON.stringify({ error: (e1 as any).message }) };
  
  const mockSummaryRow = {
      window_days: 14,
      stats: { opens: 5, contributions: 1, missedCycles: 1, unlocks: 0, unlockAttempts: 0, groupbuyBrowses: 2, groupbuyJoins: 0, refiRequests: 0, paymentsFailed: 0 },
      money: { contributed: 20000, unlocked: 0, drawCapacity: 15000 }
  };

  const summary: HabitSummary = {
    userId, orgId, windowDays: mockSummaryRow.window_days,
    stats: mockSummaryRow.stats as any, money: mockSummaryRow.money as any,
  };

  // 2) Call model
  const prompt = buildCoachPrompt(summary);
  const response = await genai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
          responseMimeType: 'application/json'
      }
  });
  const text = response.text;

  // 3) Parse JSON
  let suggestion: any;
  try { 
    suggestion = JSON.parse(text); 
  } catch { 
    return { status: 502, body: JSON.stringify({ error: 'AI JSON parse error', raw: text }) }; 
  }

  // 4) Persist suggestion
  const expire = new Date(Date.now() + 6*60*60*1000).toISOString();
  const { data: ins, error: e2 } = await sb.from('ai_action_suggestions').insert({
    org_id: orgId, user_id: userId,
    priority: suggestion.priority,
    category: suggestion.category,
    title: suggestion.title,
    cta: suggestion.cta,
    deeplink: suggestion.deeplink ?? null,
    voice_script: suggestion.voiceScript,
    expire_at: expire,
    meta: { source: 'gemini-2.5-pro', summary }
  }).select('*').single();

  // MOCKING insert for client side
  const mockInsert = { id: Date.now(), ...suggestion, org_id: orgId, user_id: userId };

  if (e2) return { status: 400, body: JSON.stringify({ error: (e2 as any).message }) };

  return { status: 200, body: JSON.stringify(mockInsert) };
}