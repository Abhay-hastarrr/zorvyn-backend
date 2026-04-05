const express = require('express');
const { userAuth, adminAuth } = require('../middlewares/auth.middleware');
const { roleRequestLimiter } = require('../middlewares/rateLimit.middleware')
const { create, getAll, getRequests, approve, reject } = require('../contorllers/roleRequest.controller')
const { body, validationResult } = require('express-validator')

const router = express.Router();

//validation rules
const requestValidation = [
    body('requestedRole')
        .isIn(['admin', 'analyst'])
        .withMessage('Requested role must be either admin or analyst'),
    body('reason')
        .optional()
        .isString()
        .withMessage('Reason must be a string')
]

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

//Routes
router.post('/', roleRequestLimiter, userAuth, requestValidation, validate, create)
router.get('/', adminAuth, getAll)
router.get('/my', userAuth, getRequests)
router.patch('/:id/approve', adminAuth, approve)
router.patch('/:id/reject', adminAuth, reject)

module.exports = router;