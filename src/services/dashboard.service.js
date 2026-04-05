const transactionModel = require('../models/transcation.model')
const { getCache, setCache } = require('../utils/cache.utils')

const activeTransactions = { isDeleted: false };

//summary
const getSummary = async () => {
    const cacheKey = 'dashboard:summary'
    const cached = getCache(cacheKey)
    if (cached) return cached

    const result = await transactionModel.aggregate([
        { $match: activeTransactions },
        {
            $group: {
                _id: '$type',
                totalAmout: { $sum: '$amount' },
            }
        }
    ])

    const summary = { totalIncome: 0, totalExpense: 0, netBalance: 0 }
    result.forEach(item => {
        if (item._id === 'income') {
            summary.totalIncome = item.totalAmout
        }
        if (item._id === 'expense') {
            summary.totalExpense = item.totalAmout
        }
    })
    summary.netBalance = summary.totalIncome - summary.totalExpense

    setCache(cacheKey, summary)
    return summary
}

//category breakdown
const getCategory = async () => {
    const cacheKey = 'dashboard:categoryBreakdown'
    const cached = getCache(cacheKey)
    if (cached) return cached

    const result = await transactionModel.aggregate([
        { $match: activeTransactions },
        {
            $group: {
                _id: { category: '$category', type: '$type' },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.category',
                breakdown: {
                    $push: {
                        type: '$_id.type',
                        totalAmount: '$totalAmount',
                        count: '$count'
                    }
                },
                categoryTotal: { $sum: '$totalAmount' }
            }
        },
        { $sort: { categoryTotal: -1 } }
    ])

    setCache(cacheKey, result)
    return result
}

//monthly trends
const getMonthlyTrends = async (year) => {
    const targetYear = parseInt(year) || new Date().getFullYear()

    const cacheKey = `dashboard:monthlyTrends:${targetYear}`
    const cached = getCache(cacheKey)
    if (cached) return cached

    const result = await transactionModel.aggregate([
        {
            $match: {
                ...activeTransactions,
                date: {
                    $gte: new Date(`${targetYear}-01-01`),
                    $lte: new Date(`${targetYear}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {
                    month: {
                        $month: '$date',
                    },
                    type: '$type'
                },
                total: { $sum: "$amount" }
            }
        },
        { $sort: { '_id.month': 1 } }

    ])

    //12 months format
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const trends = months.map((month, index) => {
        const monthNum = index+1;

        const incomeEntry = result.find((item) => item._id.month === monthNum && item._id.type === 'income')
        const expenseEntry = result.find((item) => item._id.month === monthNum && item._id.type === 'expense')

        return {
            month,
            income: incomeEntry ? incomeEntry.total : 0,
            expense: expenseEntry ? expenseEntry.total : 0, 
            netBalance: (incomeEntry ? incomeEntry.total : 0) - (expenseEntry ? expenseEntry.total : 0)
        }
    }) 

    const response = {year: targetYear, trends}
    setCache(cacheKey, response)
    return response
}

//Recent Transactions
const getRecentTransactions = async (limit = 5) => {
    const limitNumber = parseInt(limit)

    const cacheKey = `dashboard:recent:${limitNumber}`
    const cached = getCache(cacheKey)
    if (cached) return cached

    const transactions = await transactionModel.find(activeTransactions)
        .populate('createdBy', 'name email role')
        .sort({ date: -1 })
        .limit(limitNumber)
        .select('-__v') 

    setCache(cacheKey, transactions)
    return transactions
}

module.exports = { getSummary, getCategory, getMonthlyTrends, getRecentTransactions }