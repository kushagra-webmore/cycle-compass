import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
export const healthRouter = Router();
healthRouter.get('/', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
healthRouter.get('/keepalive', async (req, res) => {
    try {
        const { error } = await supabase
            .from('keepalive_logs')
            .insert([
            {
                status: 'alive',
                message: 'Keepalive ping',
                details: {
                    user_agent: req.get('user-agent'),
                    ip: req.ip
                }
            }
        ]);
        if (error) {
            logger.error('Keepalive insert error:', error);
            return res.status(500).json({ status: 'error', message: 'Failed to log keepalive' });
        }
        res.json({
            status: 'ok',
            message: 'Keepalive logged successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
        logger.error('Keepalive exception:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});
//# sourceMappingURL=health.js.map