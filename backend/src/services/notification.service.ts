import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { logger } from '../utils/logger.js';
import { StatusCodes } from 'http-status-codes';
import webpush from 'web-push';
import { env } from '../config/env.js';

// Initialize web-push
// NOTE: VAPID keys should be in env. If not, this might fail or warn.
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:noreply@cyclecompass.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  logger.warn('VAPID keys not found in environment variables. Push notifications will not work.');
}

interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

interface NotificationSettings {
  reminder_start_time: string;
  reminder_end_time: string;
  reminder_interval_minutes: number;
  enabled: boolean;
}

export class NotificationService {
  static async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    if (error) {
      logger.error(`Error saving subscription: ${error.message}`);
      throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to save subscription');
    }
  }

  static async updateSettings(userId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error(`Error updating notification settings: ${error.message}`);
      throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update settings');
    }

    return data;
  }

  static async getSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Relation not found" or "No rows found"
      logger.error(`Error fetching settings: ${error.message}`);
    }

    // Default settings if none exist
    return data || {
      reminder_start_time: '08:00:00',
      reminder_end_time: '22:00:00',
      reminder_interval_minutes: 60,
      enabled: true
    };
  }

  static async sendBroadcast(payload: any): Promise<number> {
    // 1. Get ALL subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error || !subs || subs.length === 0) return 0;

    // 2. Send to all
    const notifications = subs.map(sub => {
      return webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      ).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
        }
      });
    });

    await Promise.all(notifications);
    return subs.length;
  }

  static async sendNotification(userId: string, payload: any): Promise<void> {
    // 1. Get all user subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subs || subs.length === 0) return;

    // 2. Send to all endpoints
    const notifications = subs.map(sub => {
      return webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      ).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription is gone, delete it
          logger.info(`Subscription expired/invalid for user ${userId}, deleting.`);
          supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
        } else {
          logger.error(`Error sending push: ${err}`);
        }
      });
    });

    await Promise.all(notifications);
  }
}
