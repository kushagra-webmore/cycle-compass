import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { logger } from '../utils/logger.js';
import { StatusCodes } from 'http-status-codes';
export class WaterService {
    static async addLog(userId, amount, date) {
        const logDate = date || new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('water_logs')
            .insert({
            user_id: userId,
            amount_ml: amount,
            date: logDate
        })
            .select()
            .single();
        if (error) {
            logger.error(`Error adding water log: ${error.message}`);
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to add water log');
        }
        return data;
    }
    static async getLogsByDate(userId, date) {
        const { data, error } = await supabase
            .from('water_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .order('created_at', { ascending: true });
        if (error) {
            logger.error(`Error fetching water logs: ${error.message}`);
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch water logs');
        }
        return data || [];
    }
    static async deleteLog(userId, logId) {
        const { error } = await supabase
            .from('water_logs')
            .delete()
            .eq('id', logId)
            .eq('user_id', userId);
        if (error) {
            logger.error(`Error deleting water log: ${error.message}`);
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete water log');
        }
    }
}
//# sourceMappingURL=water.service.js.map