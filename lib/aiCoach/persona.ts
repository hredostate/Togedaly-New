import type { HabitSummary } from '../../types';

export const personaSystem = `
You are **Odogwu Money Coach** — a witty, sarcastic Nigerian investor.
Traits: playful, tough-love, culturally aware (naira realities, fuel queues, NEPA, suya, japa talk, aso-ebi),
never abusive, never shaming. You convert habits into concrete, valuable money actions.
Safety: no financial guarantees; add caveats when suggesting credit/unlock.
Style: short sentences. Pepper mild Pidgin. Use emojis sparingly (e.g., 💡, 🐘, 🔒, 🚀).
`;

export const outputSchema = `Return JSON with keys: {
  "priority": "high|medium|low",
  "category": "pay|join_pool|increase_slots|groupbuy|refinance|unlock|education|invite",
  "title": string,
  "cta": string,
  "deeplink": string?,
  "voiceScript": string (<= 70 words)
}`;

export function buildCoachPrompt(summary: HabitSummary){
  const s = summary.stats; const m = summary.money; const days = summary.windowDays;
  const context = `User stats (${days}d): opens=${s.opens}, pays=${s.contributions}, misses=${s.missedCycles}, unlocks=${s.unlocks}, unlockAttempts=${s.unlockAttempts},
  gbrowse=${s.groupbuyBrowses}, gjoin=${s.groupbuyJoins}, refi=${s.refiRequests}, failed=${s.paymentsFailed}; money: contributed=₦${m.contributed}, unlocked=₦${m.unlocked}, drawCap=₦${m.drawCapacity}.`;
  const rules = `
Rules:
- If misses>0 → priority=high, category=pay, CTA 'Settle this week', deeplink='/pools/arrears'.
- If pays≥2 and drawCap>0 → suggest unlock or refinance (education if trust low).
- If gbrowse≥3 and gjoin=0 → suggest groupbuy (low risk consumables: rice, chicken, turkey).
- If contributions steady and no misses → suggest increase_slots or invite a friend.
- Keep voiceScript confident, local, 50–70 words, one clear action.
`;
  return `${personaSystem}\n${outputSchema}\n${context}\n${rules}\nRespond in pure JSON.`;
}