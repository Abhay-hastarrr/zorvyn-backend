const express = require('express');
const { register, login, logout } = require('../contorllers/auth.controller');
const { userAuth } = require('../middlewares/auth.middleware')
const { authLimiter } = require('../middlewares/rateLimit.middleware')
const { body, validationResult } = require('express-validator')

const router = express.Router();

//validation rules
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .matches(passwordRegex)
        .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number and special character')
]

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .matches(passwordRegex)
        .withMessage('Password must be at least 8 characters and include uppercase, lowercase, number and special character')
]

//middleware validation
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            sucess: false,
            message: 'validation failed',
            errors: errors.array().map(err => err.msg)
        });
    }
    next();
};

//routes
router.post('/register', authLimiter, registerValidation, validate, register)
router.post('/login', authLimiter, loginValidation, validate, login)
router.post('/logout', userAuth, logout)

module.exports = router;

