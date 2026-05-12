import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import bikeRoutes from './routes/bike.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminRoutes from './routes/admin.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import contactRoutes from './routes/contact.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import configurePassport from './config/passport.js';
import passport from 'passport';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Configure Passport
configurePassport();

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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://campus-ride-frontend.vercel.app' // Example production URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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
app.use(passport.initialize());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// =========================
//      API ROUTES
// =========================
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CampusRide API is running 🚲' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/invoices', invoiceRoutes);

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
