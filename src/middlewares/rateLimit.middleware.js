const rateLimit = require('express-rate-limit')

// Limit login/register attempts per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many auth attempts from this IP, please try again later.'
    }
})

// Limit role-change requests per IP
const roleRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many role change requests, please try again later.'
    }
})
// Limit transaction write operations per IP
const transactionWriteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 writes per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many transaction changes from this IP, please try again later.'
    }
})

// Limit admin user updates per IP
const adminUserUpdateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many admin user updates, please slow down.'
    }
})

module.exports = { authLimiter, roleRequestLimiter, transactionWriteLimiter, adminUserUpdateLimiter }
