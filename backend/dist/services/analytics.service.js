import { getSupabaseClient } from '../lib/supabase.js';
import { subDays, format } from 'date-fns';
export const getDashboardAnalytics = async (days = 30) => {
    const supabase = getSupabaseClient();
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    // 1. Fetch Daily Snapshots (if populated)
    // Assuming analytics_daily_snapshots has: date, total_users, active_users, etc.
    const { data: snapshots } = await supabase
        .from('analytics_daily_snapshots')
        .select('*')
        .gte('snapshot_date', startDate.toISOString())
        .order('snapshot_date', { ascending: true });
    // 2. Chatbot Usage (Messages per day)
    const { data: chatbotMessages } = await supabase
        .from('chatbot_messages')
        .select('created_at, role')
        .gte('created_at', startDate.toISOString());
    // 3. User Signups (created_at)
    const { data: userSignups } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString());
    // 4. Cycle Logs (start_date)
    const { data: cycles } = await supabase
        .from('cycles')
        .select('start_date')
        .gte('start_date', startDate.toISOString());
    // Aggregate in memory (for now, scalability TBD)
    const dailyStats = new Map();
    // Fill entries
    for (let i = 0; i <= days; i++) {
        const d = subDays(endDate, days - i);
        const dateKey = format(d, 'yyyy-MM-dd');
        dailyStats.set(dateKey, {
            date: dateKey,
            newUsers: 0,
            activeUsers: 0, // Hard to calc exactly without specific logs
            messages: 0,
            cyclesStarted: 0,
        });
    }
    // Process Messages
    chatbotMessages?.forEach(msg => {
        const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd');
        if (dailyStats.has(dateKey)) {
            const entry = dailyStats.get(dateKey);
            entry.messages++;
        }
    });
    // Process Signups
    userSignups?.forEach(u => {
        const dateKey = format(new Date(u.created_at), 'yyyy-MM-dd');
        if (dailyStats.has(dateKey)) {
            const entry = dailyStats.get(dateKey);
            entry.newUsers++;
        }
    });
    // Process Cycles
    cycles?.forEach(c => {
        const dateKey = format(new Date(c.start_date), 'yyyy-MM-dd');
        if (dailyStats.has(dateKey)) {
            const entry = dailyStats.get(dateKey);
            entry.cyclesStarted++;
        }
    });
    return Array.from(dailyStats.values());
};
//# sourceMappingURL=analytics.service.js.map