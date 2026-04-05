const { summary, categoryBreakdown, monthlyTrends, recentTransactions } = require('../contorllers/dashboard.controller')
const { userAuth,analystAuth } = require('../middlewares/auth.middleware')
const express = require('express');

const router = express.Router();

//dashboard routes
router.get('/summary', analystAuth, summary)
router.get('/category-breakdown', userAuth, categoryBreakdown)
router.get('/monthly-trends', userAuth, monthlyTrends)
router.get('/recent-transactions', userAuth, recentTransactions)


module.exports = router;

