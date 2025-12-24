// services/ai/persona/snippets.ts
export function wittyLine(key:string, ctx:any){
  const name = ctx.firstName || 'My person';
  const rib = [
    'Oya now.', 'No dull am.', 'Sharp sharp.', 'As e dey hot.', 'E choke!', 'Clear road 🚀',
  ];
  const pick = rib[Math.floor(Math.random()*rib.length)];
  switch(key){
    case 'trust_up': return `${name}, your trust score just wear agbada. ${pick}`;
    case 'late_warning': return `${name}, we no go fall hand today abeg. Settle your pool now.`;
    case 'promo_deal': return `${name}, awoof no be scam this time. ${ctx.dealName} dey drop ${ctx.discount}% – move now!`;
    default: return `${name}, quick update from TrustPool.`;
  }
}
