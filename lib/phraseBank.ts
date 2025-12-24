
export type Tone = 'formal' | 'playful';

export const PHRASES = {
  greeting: {
    formal: "Welcome back,",
    playful: "Odogwu!"
  },
  next_action_header: {
    formal: "Recommended Action",
    playful: "Next best action"
  },
  arrears_title: {
    formal: "Outstanding Payment Notice",
    playful: "Oga, this is how debt starts small‑small"
  },
  arrears_body: {
    formal: "Please settle your outstanding payment for this week to avoid penalties and maintain your credit rating.",
    playful: "Guy, NEPA go take light, but your arrears no dey take break. Pay this week, keep your trust score looking fresh. No story, just click and clear. 💡"
  },
  arrears_cta: {
    formal: "Pay Now",
    playful: "Settle this week"
  },
  loading: {
    formal: "Loading...",
    playful: "E dey cook..."
  },
  no_advice: {
    formal: "No recommendations at this time.",
    playful: "No wahala, chill small."
  },
  voice_label: {
    formal: "Listen",
    playful: "🔊 Hear it"
  }
};

export function getPhrase(key: keyof typeof PHRASES, tone: Tone = 'playful') {
  return PHRASES[key][tone] || PHRASES[key]['formal'];
}
