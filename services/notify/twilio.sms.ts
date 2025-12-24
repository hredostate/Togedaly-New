// services/notify/twilio.sms.ts
import type { ProviderResult } from './types';
import { wittyLine } from '../ai/persona/snippets';

// This is a mock implementation as the Twilio library is server-side.
function renderSMS(key:string, ctx:any){
  return wittyLine(key, ctx);
}

export async function sendTwilioSMS(toE164: string, templateKey: string, ctx: any): Promise<ProviderResult> {
  try {
    const text = renderSMS(templateKey, ctx);
    console.log('MOCK sendTwilioSMS', { to: toE164, body: text });
    await new Promise(res => setTimeout(res, 250));
    return { ok:true, provider:'twilio', providerMsgId: `tw-mock-${Date.now()}` };
  } catch (e:any) {
    return { ok:false, provider:'twilio', error: e?.message || 'Twilio error' };
  }
}
