import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import verificationRoutes from './routes/verificationRoutes.js';
import notifyRoutes from './routes/notify.js';
import telegramRoutes from './routes/telegram.js';
import telegramWebhookRoutes from './routes/telegramWebhook.js';
import verifyPaymentRoutes from './routes/verifyPayment.js';

// Load environment variables
dotenv.config();

// MongoDB is removed - Using Supabase now.

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
//      MIDDLEWARE
// =========================
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "https://*.cloudinary.com", process.env.FRONTEND_URL].filter(Boolean),
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173", "http://localhost:5174", process.env.FRONTEND_URL].filter(Boolean)
    }
  }
}));

const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://campus-ride-frontend.vercel.app' // Example production URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || localOriginRegex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// =========================
//      API ROUTES
// =========================
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CampusRide API is running 🚲 (Supabase Migration in Progress)' });
});

app.use('/api', verificationRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/telegram/webhook', telegramWebhookRoutes);
app.use('/api/verify-payment', verifyPaymentRoutes);

// =========================
//    404 & ERROR HANDLER
// =========================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// =========================
//      START SERVER
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CampusRide API running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}/api/health`);
});
