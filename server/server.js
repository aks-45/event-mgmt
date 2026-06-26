import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import participantRoutes from './routes/participantRoutes.js';
import bulkMembersRoutes from './routes/bulkMembersRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import honoraryGuestRoutes from './routes/honoraryGuestRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins =
  process.env.NODE_ENV === 'development'
    ? true
    : (process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((u) => u.trim().replace(/\/+$/, ''));

console.log('CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.json({
    success: true,
    message: 'IIA Event API — backend only. Open the web app in your browser.',
    webApp: clientUrl,
    health: '/api/health',
    docs: 'See README.md for API endpoints',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'IIA Event API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/bulk-members', bulkMembersRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/honorary-guests', honoraryGuestRoutes);

app.use(errorHandler);

const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} (${HOST})`);
    if (HOST === '0.0.0.0') {
      console.log('  Local:  http://127.0.0.1:' + PORT);
      console.log('  LAN:    http://<your-pc-ip>:' + PORT);
    }
  });
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
