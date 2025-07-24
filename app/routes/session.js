const { securityLogger } = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

// Enhanced login with security logging
router.post("/login", 
    sanitizeInput,
    userValidation.login,
    handleValidationErrors,
    asyncHandler(async function(req, res, next) {
        const { userName, password } = req.body;
        const clientIp = req.ip || req.connection.remoteAddress;
        
        passport.authenticate("login", function(err, user, info) {
            if (err) {
                securityLogger.loginAttempt(userName, clientIp, false);
                return next(err);
            }
            
            if (!user) {
                securityLogger.loginAttempt(userName, clientIp, false);
                return res.status(401).render("login", {
                    isAuthenticated: false,
                    loginError: "Invalid credentials",
                    csrfToken: req.csrfToken()
                });
            }
            
            req.logIn(user, function(err) {
                if (err) {
                    securityLogger.loginAttempt(userName, clientIp, false);
                    return next(err);
                }
                
                securityLogger.loginAttempt(userName, clientIp, true);
                return res.redirect("/dashboard");
            });
        })(req, res, next);
    })
);

// Enhanced signup with error handling
router.post("/signup",
    sanitizeInput,
    userValidation.signup,
    handleValidationErrors,
    asyncHandler(async function(req, res, next) {
        const clientIp = req.ip || req.connection.remoteAddress;
        
        passport.authenticate("signup", function(err, user, info) {
            if (err) {
                logger.error('Signup error', {
                    error: err.message,
                    email: req.body.email,
                    ip: clientIp
                });
                return next(err);
            }
            
            if (!user) {
                return res.status(400).render("signup", {
                    isAuthenticated: false,
                    signUpError: info.message || 'Registration failed',
                    csrfToken: req.csrfToken()
                });
            }
            
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                
                logger.info('User registered successfully', {
                    userId: user._id,
                    email: user.email,
                    ip: clientIp
                });
                
                return res.redirect("/dashboard");
            });
        })(req, res, next);
    })
);

// Secure logout
router.get("/logout", function(req, res, next) {
    const userId = req.user ? req.user._id : 'anonymous';
    
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        
        req.session.destroy(function(err) {
            if (err) {
                return next(err);
            }
            
            logger.info('User logged out', { userId: userId });
            res.clearCookie('sessionId');
            res.redirect('/');
        });
    });
});
