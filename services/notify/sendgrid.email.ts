// services/notify/sendgrid.email.ts
import type { ProviderResult } from './types';
import { wittyLine } from '../ai/persona/snippets';

// This is a mock implementation as the SendGrid library is server-side.
const APP_BASE_URL = "https://example.com";

function baseEmail(inner:string){
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;padding:24px;background:#f7f7fb">
  <div style="max-width:640px;margin:auto;background:#fff;border-radius:16px;padding:24px">
    <h2 style="margin:0 0 12px 0">TrustPool AI</h2>
    <div style="color:#111;font-size:16px;line-height:24px">${inner}</div>
    <p style="font-size:12px;color:#666;margin-top:24px">You’re receiving this based on your notification preferences. <a href="${APP_BASE_URL}/settings/notifications">Manage</a></p>
  </div></body></html>`;
}

function renderEmail(key:string, ctx:any){
  const subject = wittyLine(key, ctx);
  const body = ctx.body || 'This is a notification from TrustPool.';
  return { subject, html: baseEmail(body) };
}

export async function sendEmailSendGrid(to: string, templateKey: string, ctx: any): Promise<ProviderResult> {
  try {
    const { subject, html } = renderEmail(templateKey, ctx);
    console.log('MOCK sendEmailSendGrid', { to, subject, html });
    await new Promise(res => setTimeout(res, 400));
    return { ok:true, provider:'sendgrid', providerMsgId: `sg-mock-${Date.now()}` };
  } catch (e:any) {
    return { ok:false, provider:'sendgrid', error: e?.message || 'SendGrid error' };
  }
}
