import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { NotificationService } from './notification.service.js';
import { DateTime } from 'luxon';
export class SchedulerService {
    static init() {
        // Run every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            logger.info('Running water reminder check...');
            await this.checkReminders();
        });
        logger.info('Scheduler initialized');
    }
    static async checkReminders() {
        try {
            const now = DateTime.now();
            const timeString = now.toFormat('HH:mm:ss');
            // 1. Get all enabled settings where current time is within window
            const { data: settingsList, error } = await supabase
                .from('notification_settings')
                .select('*')
                .eq('enabled', true)
                .lte('reminder_start_time', timeString)
                .gte('reminder_end_time', timeString);
            if (error || !settingsList) {
                logger.error(`Error fetching notification settings: ${error?.message}`);
                return;
            }
            for (const settings of settingsList) {
                await this.processUserReminder(settings, now);
            }
        }
        catch (err) {
            logger.error(`Scheduler error: ${err}`);
        }
    }
    static async processUserReminder(settings, now) {
        const userId = settings.user_id;
        const intervalMins = settings.reminder_interval_minutes || 60;
        // 2. Check last reminder time
        if (settings.last_reminder_sent_at) {
            const lastSent = DateTime.fromISO(settings.last_reminder_sent_at);
            const diffMins = now.diff(lastSent, 'minutes').minutes;
            if (diffMins < intervalMins) {
                return; // Too soon since last reminder
            }
        }
        // 3. Check last water log time
        // We only want to remind if they haven't drunk water recently
        const { data: lastLog } = await supabase
            .from('water_logs')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (lastLog) {
            const lastLogTime = DateTime.fromISO(lastLog.created_at);
            const diffMins = now.diff(lastLogTime, 'minutes').minutes;
            if (diffMins < intervalMins) {
                return; // Look, they just drank water!
            }
        }
        // 4. Send Notification
        try {
            await NotificationService.sendNotification(userId, {
                title: 'Hydration Check 💧',
                body: `It's been a while! Time to drink some water.`,
                icon: '/icons/water-icon.png', // Ensure this exists or use generic
                data: { url: '/dashboard' }
            });
            // 5. Update last_reminder_sent_at
            await supabase
                .from('notification_settings')
                .update({ last_reminder_sent_at: now.toISO() })
                .eq('user_id', userId);
            logger.info(`Reminder sent to user ${userId}`);
        }
        catch (e) {
            logger.error(`Failed to send reminder to ${userId}`);
        }
    }
}
//# sourceMappingURL=scheduler.service.js.map