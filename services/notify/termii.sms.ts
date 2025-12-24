// services/notify/termii.sms.ts
import type { ProviderResult } from './types';
import { wittyLine } from '../ai/persona/snippets';

// This is a mock implementation as we cannot use Node.js `fetch` or secret keys here.
function renderSMS(key:string, ctx:any){
  return wittyLine(key, ctx);
}

export async function sendTermiiSMS(toE164: string, templateKey: string, ctx: any): Promise<ProviderResult> {
    console.log('MOCK sendTermiiSMS', { to: toE164, templateKey, ctx });
    const text = renderSMS(templateKey, ctx);
    if (!toE164) return { ok: false, provider: 'termii', error: 'No phone number' };

    await new Promise(res => setTimeout(res, 200));

    return { ok: true, provider:'termii', providerMsgId: `tm-mock-${Date.now()}` };
}
