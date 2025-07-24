const { logger } = require('../utils/logger');

// Global error handler
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Application error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user._id : 'anonymous'
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: isDevelopment ? err.errors : 'Invalid input provided'
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }
    
    if (err.code === 11000) { // MongoDB duplicate key error
        return res.status(409).json({
            success: false,
            message: 'Resource already exists'
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Default to 500 server error
    res.status(err.status || 500);
    
    if (req.accepts('json')) {
        res.json({
            success: false,
            message: isDevelopment ? err.message : 'Internal server error',
            stack: isDevelopment ? err.stack : undefined
        });
    } else {
        res.render('error', {
            message: isDevelopment ? err.message : 'Something went wrong',
            error: isDevelopment ? err : {},
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
        });
    }
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    logger.warn('404 Not Found', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user._id : 'anonymous'
    });

    res.status(404);
    
    if (req.accepts('json')) {
        res.json({
            success: false,
            message: 'Resource not found'
        });
    } else {
        res.render('error', {
            message: 'Page not found',
            error: { status: 404 },
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
        });
    }
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};
