
// services/notificationService.ts
import type { MessageTemplate, InboxMessage, NotificationChannel, NotificationStyle, Notification, NotificationDelivery, UserNotificationPrefs, PlatformSetting, UserSettings } from '../types';
import { mockUserProfiles } from '../data/ajoMockData';
import { supabase } from '../supabaseClient';

// --- MOCK FALLBACK DATA ---
let mockNotifications: Notification[] = [
    { id: 'msg-1', recipient: 'user-001', title: 'Welcome to Togedaly!', body: 'We are glad to have you on board. Start by exploring ventures.', read_at: null, created_at: new Date(Date.now() - 86400000).toISOString(), kind: 'toast', meta: {}, delivery_status: 'sent', delivery_channels: ['toast'], tries: 1 },
];

let mockPreferences: Record<string, UserNotificationPrefs> = {};

// --- HYBRID SERVICE FUNCTIONS ---

export async function enqueueNotification(
    channel: NotificationChannel,
    style: NotificationStyle,
    payload: Record<string, any>
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const recipient = user?.id || 'mock-user-id';

    const newNotif = {
        recipient: recipient,
        title: payload.title,
        body: payload.body,
        kind: 'toast',
        meta: payload,
        delivery_status: 'sent',
        delivery_channels: [channel],
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase.from('notifications').insert(newNotif);
        if (error) throw error;
    } catch (e) {
        console.warn("DB Insert failed, using mock:", e);
        mockNotifications.unshift({ ...newNotif, id: `msg-${Date.now()}`, read_at: null, tries: 1 } as Notification);
    }
}

export async function getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mockNotifications.filter(m => !m.read_at).length;

    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient', user.id)
            .is('read_at', null);
        
        if (error) throw error;
        return count || 0;
    } catch (e) {
        return mockNotifications.filter(m => !m.read_at).length;
    }
}

export async function getInboxMessages(): Promise<InboxMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
        if (!user) throw new Error("No user");
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient', user.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data as InboxMessage[];
    } catch (e) {
        return [...mockNotifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
}

export async function markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        mockNotifications.forEach(m => m.read_at = new Date().toISOString());
        return;
    }

    try {
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('recipient', user.id)
            .is('read_at', null);
    } catch (e) {
        console.warn("Failed to mark as read in DB");
    }
}

// --- SETTINGS ---

export async function getUserNotificationPrefs(userId: string): Promise<UserNotificationPrefs> {
    try {
        const { data } = await supabase.from('user_notification_prefs').select('*').eq('user_id', userId).maybeSingle();
        if (data) return data;
    } catch {}
    
    return mockPreferences[userId] || { 
        user_id: userId, 
        default_channels: ['toast', 'sms'], 
        quiet_hours: { enabled: false, from: '22:00', to: '06:00', tz: 'Africa/Lagos' }, 
        updated_at: new Date().toISOString() 
    };
}

export async function updateUserNotificationPrefs(userId: string, prefs: Partial<UserNotificationPrefs>): Promise<UserNotificationPrefs> {
    try {
        const { data, error } = await supabase
            .from('user_notification_prefs')
            .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        console.warn("DB Prefs update failed, using mock");
        const existing = mockPreferences[userId] || { user_id: userId };
        mockPreferences[userId] = { ...existing, ...prefs } as UserNotificationPrefs;
        return mockPreferences[userId];
    }
}

export async function getUserSettings(userId: string): Promise<Partial<UserSettings>> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return {};
  return data || {};
}

export async function updateUserSettings(userId: string, settings: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// --- ADMIN / MOCK HELPERS (Keep these for Admin Console) ---
export async function getAdminNotificationsList(): Promise<Notification[]> {
    return mockNotifications;
}
export async function estimateSmsCost(notification_ids: string[]): Promise<any> {
    return { unit_ngn: 3.2, recipients: 1, total_ngn: 3.2 };
}
export async function queueNotifications(ids: string[], notifs: any[], channels: any[]) {
    return { ok: true, queued: ids.length };
}
export async function dispatchNotifications() {
    return { ok: true, processed: 0 };
}
export async function getTemplates() { return []; }
