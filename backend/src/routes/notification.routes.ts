import express from 'express';
import { NotificationService } from '../services/notification.service.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.use(authenticate);

router.post('/subscribe', async (req, res, next) => {
  try {
    const subscription = req.body;
    // @ts-ignore
    const userId = req.user.id;

    await NotificationService.saveSubscription(userId, subscription);
    res.status(StatusCodes.CREATED).json({ message: 'Subscribed successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const settings = await NotificationService.getSettings(userId);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const settings = req.body;
    
    const updated = await NotificationService.updateSettings(userId, settings);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    await NotificationService.sendNotification(userId, {
      title: 'Test Notification',
      body: 'This is a test from Cycle Compass!',
    });
    res.json({ message: 'Sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/broadcast', requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const { title, body } = req.body;
    
    // SECURITY: Role check handled by requireRoles middleware
    const count = await NotificationService.sendBroadcast({
      title: title || 'System Broadcast 📢',
      body: body || 'This is a test message to all users.',
    });
    res.json({ message: `Broadcast sent to ${count} devices` });
  } catch (error) {
    next(error);
  }
});

export const notificationRouter = router;
