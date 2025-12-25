
// lib/nudge/sendNudge.ts (pseudo)
import { supabaseAdmin as sb } from '../../supabaseClient';
import * as ExpoServer from 'expo-server-sdk';

const expo = new ExpoServer.Expo();

export async function sendNudge(nudge: {
  orgId: number;
  userId: string;
  message: string;
  channel: ('whatsapp' | 'push' | 'in_app')[];
}) {
  // existing WhatsApp + in-app logic...

  if (nudge.channel.includes('push')) {
    const { data: tokens } = await sb
      .from('mobile_push_tokens')
      .select('token')
      .eq('user_id', nudge.userId);

    const messages =
      tokens?.map((t: { token: string }) => ({
        to: t.token,
        sound: 'default' as const,
        body: nudge.message,
        data: { type: 'NUDGE' },
      })) ?? [];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  }
}
