const transactionModel = require('../models/transcation.model')
const { clearCacheByPrefix } = require('../utils/cache.utils')

//creating transaction
const createTranscation = async (data, userId) => {
    const transcation = await transactionModel.create({
        ...data,
        createdBy: userId
    })
    // transactions changed, invalidate dashboard caches
    clearCacheByPrefix('dashboard:')
    return transcation
}

//get transactions with filters and pagination
const getTransactions = async (filters) => {
    const {
        type,
        category,
        from,
        to,
        page = 1,
        limit = 10
    } = filters;

    //build query and avaoiding soft deleted records
    const query = { isDeleted: false }

    if (type) query.type = type //if type is provided then add it to query otherwise ignore
    if (category) query.category = { $regex: category, $options: 'i' } //case insensitive search

    //date range filter
    if (from || to) {
        query.date = {}
        if (from) query.date.$gte = new Date(from) //greater than or equal to from date
        if (to) query.date.$lte = new Date(to) //less than or equal to to date
    }

    //pagination
    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)
    const skip = (pageNumber - 1) * limitNumber

    const total = await transactionModel.countDocuments(query)
    const transactions = await transactionModel.find(query)
        .populate('createdBy', 'name email role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNumber)
        .select('-__v')

    return {
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        limit: limitNumber,
        transactions
    }
}

//get transaction by id
const getTransactionById = async (id) => {
    const transaction = await transactionModel.findOne({ 
        _id: id,
        isDeleted: false 
    })
    .populate('createdBy', 'name email role')
    .select('-__v')

    if(!transaction){
        const error = new Error('Transaction not found')
        error.statusCode = 404
        throw error
    }

    return transaction
}

//update transaction
const updateTransaction = async (id, data) => {
    delete data.createdBy //prevent changing ownership
    delete data.isDeleted //prevent changing deletion status

    const transaction = await transactionModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        data,
        { new: true , runValidators: true } //return updated document and run validators on update
    ).select('-__v')

    if(!transaction){
        const error = new Error('Transaction not found or already deleted')
        error.statusCode = 404  
        throw error
    }
    // transactions changed, invalidate dashboard caches
    clearCacheByPrefix('dashboard:')
    return transaction
}

//soft delete
const softDeleteTransaction = async (id) => {
    const transaction = await transactionModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    )

    if(!transaction){
        const error = new Error('Transaction not found or already deleted')
        error.statusCode = 404  
        throw error
    }
    // transactions changed, invalidate dashboard caches
    clearCacheByPrefix('dashboard:')
    return transaction
}

module.exports = { createTranscation, getTransactions, getTransactionById, updateTransaction, softDeleteTransaction }
