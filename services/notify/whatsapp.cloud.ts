// services/notify/whatsapp.cloud.ts
import type { ProviderResult } from './types';

// This is a mock implementation as we cannot use Node.js `fetch` or secret keys here.
export async function sendWhatsAppCloud(toE164: string, templateKey: string, ctx: any): Promise<ProviderResult> {
  console.log('MOCK sendWhatsAppCloud', { toE164, templateKey, ctx });
  if (!toE164) return { ok: false, provider: 'whatsapp_cloud', error: 'No phone number' };
  
  await new Promise(res => setTimeout(res, 300));

  return { ok: true, provider: 'whatsapp_cloud', providerMsgId: `wa-mock-${Date.now()}` };
}
