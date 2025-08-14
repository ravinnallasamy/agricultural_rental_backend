/**
 * Agricultural Equipment Rental Platform - Backend Server
 *
 * This application serves as the backend API for an agricultural equipment rental platform
 * where farmers can rent equipment from providers. The system handles user authentication,
 * equipment management, and rental request processing.
 *
 * Author: Development Team
 * Created: 2025
 * Purpose: Educational project for learning full-stack development
 */

// Import essential Node.js modules for web server functionality
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// Import configuration and database connection
const config = require('./config/config');
const connectDB = require('./config/database');

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const providersRouter = require('./routes/providers');
const equipmentsRouter = require('./routes/equipments');
const requestsRouter = require('./routes/requests');

const app = express();

// Validate and display configuration
config.validate();
config.display();

// Connect to MongoDB
connectDB();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(logger('dev'));
// CORS configuration to allow frontend connections from multiple ports
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Dynamic allowed origins from configuration
    const allowedOrigins = [
      ...config.urls.frontendUrls,  // All configured frontend URLs
      config.urls.frontend,         // Primary frontend URL
      config.urls.backend           // Backend URL for testing
    ];

    // Add localhost variations for development
    config.urls.frontendPorts.forEach(port => {
      allowedOrigins.push(`http://localhost:${port}`);
      allowedOrigins.push(`http://127.0.0.1:${port}`);
    });

    // Add production deployment patterns for common hosting platforms
    const productionPatterns = [
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.herokuapp\.com$/,
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.render\.com$/,
      /^https:\/\/.*\.surge\.sh$/,
      /^https:\/\/.*\.github\.io$/
    ];

    // Check if origin matches production patterns
    const isProductionOrigin = productionPatterns.some(pattern => pattern.test(origin));
    if (isProductionOrigin) {
      allowedOrigins.push(origin);
    }

    // Remove duplicates and filter out null/undefined values
    const uniqueOrigins = [...new Set(allowedOrigins.filter(Boolean))];

    if (uniqueOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`   Allowed origins: ${uniqueOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/providers', providersRouter);
app.use('/api/equipments', equipmentsRouter);
app.use('/api/requests', requestsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Rental App Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
