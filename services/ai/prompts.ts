
export const Prompts = {
  trustUp: (ctx: any) => `Context: ${JSON.stringify(ctx)}\nGoal: Congratulate user for on-time payment. Suggest next action (join another slot, invite a friend, or peek deals). Output: {title, body, ctas:[{label,action}]} JSON.`,
  trustDown: (ctx: any) => `Context: ${JSON.stringify(ctx)}\nGoal: Nudge gently about a miss/penalty. Offer a path: pay now, set reminder, or request grace. Output JSON {title, body, ctas}`,
  peerComment: (ctx: any) => `Context: ${JSON.stringify(ctx)}\nGoal: Notify approved peer comment that impacted trust. Encourage replying with thanks or returning the favour. Output JSON {title, body, ctas}`,
  unlockEligible: (ctx:any)=> `Context: ${JSON.stringify(ctx)}\nGoal: User is eligible to unlock some collateral. Explain small and safe: unlock 20% or roll into a group-buy. Output JSON {title, body, ctas}`,
  refiEligible: (ctx:any)=> `Context: ${JSON.stringify(ctx)}\nGoal: User qualifies to refinance an existing loan with zero-interest draw + fee-on-flow. Offer checklist. Output JSON {title, body, ctas}`,
  dealOpportunity: (ctx:any)=> `Context: ${JSON.stringify(ctx)}\nGoal: Promote a live group-buy (cow/rice/turkey etc.). Create urgency ethically. Output JSON {title, body, ctas}`,
  chatMomentum: (ctx:any)=> `Context: ${JSON.stringify(ctx)}\nGoal: Conversation is cooling. Suggest smart follow-up or attach invoice link. Output JSON {title, body, ctas}`
};
