const { ObjectId } = require('mongodb');

// Enhanced authentication middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
        // Regenerate session ID to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.redirect('/login');
            }
            next();
        });
    } else {
        res.redirect('/login');
    }
};

// Authorization middleware for checking user ownership
const ensureOwnership = (req, res, next) => {
    const userId = req.params.userId || req.body.userId || req.query.userId;
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID required'
        });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }
    
    // Check if user owns the resource
    if (req.user._id.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: insufficient permissions'
        });
    }
    
    next();
};

// Role-based access control
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: insufficient privileges'
            });
        }
        next();
    };
};

// Admin check middleware
const ensureAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

module.exports = {
    ensureAuthenticated,
    ensureOwnership,
    requireRole,
    ensureAdmin
};
