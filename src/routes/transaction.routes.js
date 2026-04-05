const { createTransaction, getAllTransactions, getById, update, softDelete } = require('../contorllers/transaction.controller');
const { userAuth, adminAuth, analystAuth } = require('../middlewares/auth.middleware')
const { transactionWriteLimiter } = require('../middlewares/rateLimit.middleware')
const { body, validationResult } = require('express-validator')

const express = require('express');

const router = express.Router();

//validation rules
const transactionValidation = [
    body('amount')
        .isNumeric().withMessage('Amount must be a number')
        .custom(value => value > 0).withMessage('Amount must be greater than zero'),
    body('type')
        .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('category')
        .notEmpty().withMessage('Category is required'),
    body('date')
        .isISO8601().withMessage('Date must be in ISO8601 format (YYYY-MM-DD)')
        .custom(value => {
            if (new Date(value) > new Date()) {
                throw new Error('Transaction date cannot be in the future')
            }
            return true
        })
]

//upadte validation
const updateTransactionValidation = [
    body('amount')
        .optional()
        .isNumeric().withMessage('Amount must be a number')
        .custom(value => value > 0).withMessage('Amount must be greater than zero'),
    body('type')
        .optional()
        .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('category')
        .optional()
        .notEmpty().withMessage('Category is required'),
    body('date')
        .optional()
        .isISO8601().withMessage('Date must be in ISO8601 format (YYYY-MM-DD)')
        .custom(value => {
            if (new Date(value) > new Date()) {
                throw new Error('Transaction date cannot be in the future')
            }
            return true
        })
]

//validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            sucess: false,
            message: 'Validation failed',
            errors: errors.array().map(e => e.msg)
        })
    }
    next()
}

//transaction routes
router.post('/', transactionWriteLimiter, adminAuth, transactionValidation, validate, createTransaction)
router.get('/', userAuth, getAllTransactions)
router.get('/:id', userAuth, getById)
router.patch('/:id', transactionWriteLimiter, adminAuth, updateTransactionValidation, validate, update)
router.delete('/:id', transactionWriteLimiter, adminAuth, softDelete)



module.exports = router;

