// services/notify/types.ts
export type Channel = 'whatsapp'|'sms'|'email'|'inapp';
export type SendStatus = 'queued'|'sending'|'sent'|'failed'|'delivered'|'read';

export interface OutboundJob {
  userId: string;
  channel: Channel;
  templateKey: string;     // maps to AI nudge or static template
  context: Record<string, any>; // personalize
}

export interface ProviderResult {
  ok: boolean;
  provider: string;
  providerMsgId?: string;
  error?: string;
}
