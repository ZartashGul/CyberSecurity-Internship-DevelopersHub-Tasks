const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const csrf = require('csurf');

const app = express();

// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false, // Adjust based on your needs
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per windowMs
    message: {
        error: "Too many login attempts from this IP, please try again later."
    },
    skipSuccessfulRequests: true
});

app.use(limiter);

// Session configuration with security enhancements
app.use(session({
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/nodegoat',
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // use secure cookies in production
        httpOnly: true,
        maxAge: 1800000, // 30 minutes
        sameSite: 'strict'
    },
    name: 'sessionId' // Don't use default session cookie name
}));

// CSRF protection
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

app.use(csrfProtection);

// Make CSRF token available to all views
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Apply login rate limiting to auth routes
app.use('/login', loginLimiter);
app.use('/signup', loginLimiter);

// Additional security middleware
app.use(function(req, res, next) {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
});

// Error handling middleware
app.use(function(err, req, res, next) {
    // Handle CSRF token errors
    if (err.code === 'EBADCSRFTOKEN') {
        res.status(403);
        res.send('Invalid CSRF token');
    } else {
        // Log error but don't expose details to client
        console.error('Error:', err);
        res.status(500);
        res.render('error', {
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }
});
app.use((req, res, next) => {
    logger.info('Request received', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user._id : 'anonymous'
    });
    next();
});
