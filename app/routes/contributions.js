const { contributionsValidation, handleValidationErrors, sanitizeInput } = require('../middleware/validation');

// Add validation to contribution routes
router.post("/",
    ensureAuthenticated,
    sanitizeInput,
    contributionsValidation,
    handleValidationErrors,
    function(req, res, next) {
        const userId = req.user._id;
        const pretax = parseFloat(req.body.pretax) || 0;
        const roth = parseFloat(req.body.roth) || 0;
        
        // Additional business logic validation
        if (pretax + roth > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Total contributions cannot exceed $50,000'
            });
        }

        contributionsDAO.update(userId, pretax, roth, function(err, result) {
            if (err) {
                console.error("Error updating contributions:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
            res.redirect("/contributions");
        });
    }
);
