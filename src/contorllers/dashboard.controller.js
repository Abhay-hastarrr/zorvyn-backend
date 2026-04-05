const { getSummary, getCategory, getMonthlyTrends, getRecentTransactions } = require('../services/dashboard.service')
const {success} = require('../utils/apiResponse.utils')

//summary
const summary = async (req, res, next) => {
    try {
        const data = await getSummary()
        success(res, data, 'Dashboard summary retrieved successfully')
    } catch (err) {
        next(err)
    }   
}

//category breakdown
const categoryBreakdown = async (req, res, next) => {
    try {
        const data = await getCategory()
        success(res, data, 'Category breakdown retrieved successfully')
    } catch (err) {
        next(err)
    }   
}

//monthly trends
const monthlyTrends = async (req, res, next) => {
    try {
        const { year } = req.query  
        const data = await getMonthlyTrends(year)
        success(res, data, 'Monthly trends retrieved successfully')
    } catch (err) {
        next(err)
    }   
}

//recent transactions
const recentTransactions = async (req, res, next) => {
    try{
        const {limit} = req.query
        const data = await getRecentTransactions(limit)
        success(res, data, 'Recent transactions retrieved successfully')
    } catch(err){
        next(err)
    }
}

module.exports = { summary, categoryBreakdown, monthlyTrends, recentTransactions }