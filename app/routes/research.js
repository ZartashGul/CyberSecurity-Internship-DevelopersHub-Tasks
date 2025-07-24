const { researchValidation, handleValidationErrors, sanitizeInput } = require('../middleware/validation');

router.post("/",
    ensureAuthenticated,
    sanitizeInput,
    researchValidation,
    handleValidationErrors,
    function(req, res, next) {
        const symbol = req.body.symbol.toUpperCase();
        
        // Use parameterized query instead of string concatenation
        const query = { symbol: symbol };
        
        db.stocks.findOne(query, function(err, stock) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }
            
            res.render("research", {
                isAuthenticated: req.isAuthenticated(),
                stock: stock,
                searchSymbol: symbol
            });
        });
    }
);
