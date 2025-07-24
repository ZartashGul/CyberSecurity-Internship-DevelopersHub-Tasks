const { memoValidation, handleValidationErrors, sanitizeInput } = require('../middleware/validation');

router.post("/addMemo",
    ensureAuthenticated,
    sanitizeInput,
    memoValidation,
    handleValidationErrors,
    function(req, res, next) {
        const userId = req.user._id;
        const memo = req.body.memo;
        
        // Additional validation
        if (memo.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Memo cannot be empty'
            });
        }

        const memoDoc = {
            userId: userId,
            memo: memo,
            timestamp: new Date()
        };

        memosDAO.insert(memoDoc, function(err, result) {
            if (err) {
                console.error("Error saving memo:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save memo'
                });
            }
            res.redirect("/memos");
        });
    }
);
