const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize all string inputs
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = DOMPurify.sanitize(obj[key], { 
                    ALLOWED_TAGS: [],
                    ALLOWED_ATTR: []
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    
    next();
};

// Validation rules
const userValidation = {
    login: [
        body('userName')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9._-]+$/)
            .withMessage('Username contains invalid characters'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
    ],
    signup: [
        body('userName')
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9._-]+$/)
            .withMessage('Username contains invalid characters'),
        body('firstName')
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be between 1 and 50 characters')
            .matches(/^[a-zA-Z\s-']+$/)
            .withMessage('First name contains invalid characters'),
        body('lastName')
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be between 1 and 50 characters')
            .matches(/^[a-zA-Z\s-']+$/)
            .withMessage('Last name contains invalid characters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email format'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain uppercase, lowercase, number and special character')
    ]
};

const contributionsValidation = [
    body('pretax')
        .isNumeric()
        .withMessage('Pretax contribution must be a number')
        .custom(value => {
            if (value < 0 || value > 50000) {
                throw new Error('Pretax contribution must be between 0 and 50000');
            }
            return true;
        }),
    body('roth')
        .isNumeric()
        .withMessage('Roth contribution must be a number')
        .custom(value => {
            if (value < 0 || value > 50000) {
                throw new Error('Roth contribution must be between 0 and 50000');
            }
            return true;
        })
];

const researchValidation = [
    body('symbol')
        .isLength({ min: 1, max: 10 })
        .withMessage('Stock symbol must be between 1 and 10 characters')
        .matches(/^[A-Z0-9.-]+$/)
        .withMessage('Stock symbol contains invalid characters')
];

const memoValidation = [
    body('memo')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Memo must be between 1 and 1000 characters')
];

module.exports = {
    handleValidationErrors,
    sanitizeInput,
    userValidation,
    contributionsValidation,
    researchValidation,
    memoValidation
};
