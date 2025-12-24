// services/notify/router.ts
import { sendWhatsAppCloud } from './whatsapp.cloud';
import { sendTwilioSMS } from './twilio.sms';
import { sendTermiiSMS } from './termii.sms';
import { sendEmailSendGrid } from './sendgrid.email';
import type { OutboundJob, ProviderResult } from './types';
import { supabase as sb } from '../../supabaseClient';

export async function deliver(job: OutboundJob): Promise<ProviderResult> {
  // Load contacts & prefs (mocked)
  const { data: contact } = await sb
    .from('user_contacts').select('*').eq('user_id', job.userId).single();

  // Basic guard
  if (!contact) return { ok:false, provider:'none', error:'No contacts' };

  switch (job.channel) {
    case 'whatsapp': {
      // Prefer Meta Cloud (template-based & cheap); fallback Twilio WA if configured
      if (contact.whatsapp_opt_in && contact.whatsapp_msisdn) {
        const res = await sendWhatsAppCloud(contact.whatsapp_msisdn, job.templateKey, job.context);
        if (res.ok) return res;
      }
      // fallback to SMS
      return await smsFallback(contact, job);
    }
    case 'sms': {
      return await smsFallback(contact, job);
    }
    case 'email': {
      if (contact.email_opt_in && contact.email) {
        return await sendEmailSendGrid(contact.email, job.templateKey, job.context);
      }
      // fallback in-app if no email
      return { ok:false, provider:'sendgrid', error:'No email; show in-app' };
    }
    default:
      return { ok:false, provider:'none', error:'Unsupported channel' };
  }
}

async function smsFallback(contact: any, job: OutboundJob): Promise<ProviderResult> {
  // Use Termii first for NG delivery + DND routes; fallback Twilio
  if (contact.sms_opt_in && contact.sms_msisdn) {
    const t = await sendTermiiSMS(contact.sms_msisdn, job.templateKey, job.context);
    if (t.ok) return t;
    return await sendTwilioSMS(contact.sms_msisdn, job.templateKey, job.context);
  }
  return { ok:false, provider:'sms', error:'No SMS number/opt-in' };
}
