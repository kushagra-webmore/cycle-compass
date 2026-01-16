import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { cycleRouter, symptomRouter } from './routes/cycle.js';
import { journalRouter } from './routes/journal.js';
import { pairingRouter } from './routes/pairing.js';
import { partnerRouter } from './routes/partner.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { adminDataRouter } from './routes/admin-data.js';
import { userRouter } from './routes/user.js';
import { chatbotRouter } from './routes/chatbot.js';
import { healthRouter } from './routes/health.js';
const app = express();
app.use(helmet());
const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://cycle-compass.vercel.app',
    env.CLIENT_APP_URL
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
        return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
// Log request body for debugging
app.use((req, res, next) => {
    console.log('Request Body:', req.body);
    next();
});
// Winston HTTP request logging
app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
        const { statusCode } = res;
        const responseTime = Date.now() - start;
        logger.http('Request', {
            method,
            url: originalUrl,
            status: statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    });
    next();
});
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/cycles', cycleRouter);
app.use('/symptoms', symptomRouter);
app.use('/journals', journalRouter);
app.use('/pairings', pairingRouter);
app.use('/partner', partnerRouter);
app.use('/ai', aiRouter);
app.use('/admin', adminRouter);
app.use('/admin', adminDataRouter);
app.use('/users', userRouter);
app.use('/chatbot', chatbotRouter);
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map