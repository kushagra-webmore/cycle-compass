import express from 'express';
import { WaterService } from '../services/water.service.js';
import { authenticate } from '../middleware/auth.js';
import { StatusCodes } from 'http-status-codes';
const router = express.Router();
router.use(authenticate);
router.post('/', async (req, res, next) => {
    try {
        const { amount, date } = req.body;
        // @ts-ignore - user is attached by requireAuth
        const userId = req.user.id;
        // basic validation
        if (!amount || typeof amount !== 'number') {
            res.status(StatusCodes.BAD_REQUEST).json({ error: 'Amount is required and must be a number' });
            return;
        }
        const log = await WaterService.addLog(userId, amount, date);
        res.status(StatusCodes.CREATED).json(log);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:date', async (req, res, next) => {
    try {
        const { date } = req.params;
        // @ts-ignore
        const userId = req.user.id;
        const logs = await WaterService.getLogsByDate(userId, date);
        res.json(logs);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user.id;
        await WaterService.deleteLog(userId, id);
        res.status(StatusCodes.NO_CONTENT).send();
    }
    catch (error) {
        next(error);
    }
});
export const waterRouter = router;
//# sourceMappingURL=water.routes.js.map