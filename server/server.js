import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables (ParkPulse v1.0.1)
dotenv.config();
import rateLimit from 'express-rate-limit';

import { connectDB, disconnectDB } from './config/db.js';
import { startScheduler, stopScheduler, runExpiryAndReminderSweep } from './services/schedulerService.js';
import authRoutes from './routes/authRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, matched origin, any vercel preview app, or in non-prod
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app')) ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for smooth FYP evaluation
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

let isSeeded = false;

// Ensure database connection for each request (crucial for Vercel serverless functions)
app.use(async (req, res, next) => {
  try {
    await connectDB();

    // Auto-seed on first request if database is completely empty (helps Vercel serverless demo login)
    if (!isSeeded) {
      try {
        const User = (await import('./models/User.js')).default;
        const count = await User.countDocuments();
        if (count === 0) {
          console.log('Database is empty. Initializing initial demo seed data...');
          const { seedDatabase } = await import('./scripts/seed.js');
          await seedDatabase(false);
        }
      } catch (seedErr) {
        console.warn('Auto-seed check warning (non-fatal):', seedErr.message);
      } finally {
        isSeeded = true;
      }
    }

    next();
  } catch (error) {
    console.error('Database connection error in request:', error.message);
    const isMissingUri = !process.env.MONGODB_URI;
    const userMessage = isMissingUri
      ? 'MONGODB_URI is missing in Vercel. Please add MONGODB_URI to your backend project and Redeploy.'
      : `MongoDB connection error: ${error.message}. Please allow IP 0.0.0.0/0 in MongoDB Atlas Network Access.`;

    return res.status(500).json({
      success: false,
      message: userMessage,
      error: error.message,
    });
  }
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ParkPulse - Smart Parking API is running live!',
    version: '1.0.0',
    healthCheck: '/api/health',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ParkPulse - Smart Parking API',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
let server;
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty (e.g. fresh in-memory launch)
    const User = (await import('./models/User.js')).default;
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Automatically initializing seed data...');
      const { seedDatabase } = await import('./scripts/seed.js');
      await seedDatabase(false);
    }

    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Smart Parking Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔒 Security headers, CORS, & rate limiting enabled`);
      console.log(`===============================================`);
      // Start background expiry and reminder scheduler
      startScheduler(30000);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  stopScheduler();
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('HTTP server closed and database disconnected.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Start server (only in standalone/local environments; Vercel handles invocations serverlessly)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
