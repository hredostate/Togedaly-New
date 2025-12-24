// /jobs/coach.nightly.ts  (run with your worker or cron-trigger)
import { supabase as sb } from '../supabaseClient';
import { GoogleGenAI } from '@google/genai';
import { buildCoachPrompt } from '../lib/aiCoach/persona';
import type { HabitSummary } from '../types';

export async function run(){
  if (!process.env.API_KEY) {
    console.error("NIGHTLY JOB: API_KEY not set. Aborting.");
    return;
  }
  const genai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { data: users } = await sb.from('user_event_log')
    .select('org_id, user_id').gte('ts', new Date(Date.now()-30*864e5).toISOString());
    
  const pairs = Array.from(new Set((users||[]).map(u=>`${u.org_id}:${u.user_id}`)));
  console.log(`NIGHTLY JOB: Found ${pairs.length} active users to process.`);

  for (const key of pairs){
    const [orgId, userId] = (key as string).split(':');
    
    // In a real app, these RPC and select calls would run against the database.
    // For this mock, we'll just log that they would be called.
    console.log(`NIGHTLY JOB: Processing ${userId}...`);
    // await sb.rpc('recompute_user_habits', { p_org: Number(orgId), p_user: userId, p_days: 14 });
    // const { data: summaryRow } = await sb.from('user_habit_summary').select('*').eq('org_id', Number(orgId)).eq('user_id', userId).single();
    
    // Using mock data for the summary to proceed with the AI call
    const mockSummaryRow = {
        window_days: 14,
        stats: { opens: 10, contributions: 4, missedCycles: 0, unlocks: 1, unlockAttempts: 1, groupbuyBrowses: 5, groupbuyJoins: 1, refiRequests: 0, paymentsFailed: 0 },
        money: { contributed: 80000, unlocked: 10000, drawCapacity: 30000 }
    };
    
    const summary: HabitSummary = { userId, orgId: Number(orgId), windowDays: mockSummaryRow.window_days, stats: mockSummaryRow.stats as any, money: mockSummaryRow.money as any };
    const prompt = buildCoachPrompt(summary);
    
    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        const text = response.text;
        
        const s = JSON.parse(text);

        // MOCKING the insert call
        console.log(`NIGHTLY JOB: Generated and would insert suggestion for ${userId}:`, s.title);
        // await sb.from('ai_action_suggestions').insert({
        //   org_id: Number(orgId), user_id: userId,
        //   priority: s.priority, category: s.category, title: s.title, cta: s.cta,
        //   deeplink: s.deeplink ?? null, voice_script: s.voiceScript,
        //   expire_at: new Date(Date.now()+6*3600*1000).toISOString(), meta: { source: 'gemini', summary }
        // });
    } catch (e) {
      console.error(`NIGHTLY JOB: Failed to generate suggestion for ${userId}`, e);
    }
  }
}