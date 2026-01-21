import { supabase } from '../config/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { logger } from '../utils/logger.js';
import { StatusCodes } from 'http-status-codes';

interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  date: string;
  created_at: string;
}

export class WaterService {
  static async addLog(userId: string, amount: number, date?: string): Promise<WaterLog> {
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

  static async getLogsByDate(userId: string, date: string): Promise<WaterLog[]> {
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

  static async deleteLog(userId: string, logId: string): Promise<void> {
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
