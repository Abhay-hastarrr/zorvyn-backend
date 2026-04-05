const { createTranscation, getTransactions, getTransactionById, updateTransaction, softDeleteTransaction } = require('../services/transaction.service')
const { success } = require('../utils/apiResponse.utils')

//create transaction
const createTransaction = async (req, res, next) => {
    try {

        const transaction = await createTranscation(req.body, req.user.id)
        success(res, transaction, 'Transaction created successfully', 201)

    } catch (err) {

        next(err);

    }
}

//get all transactions with pagination, sorting and filtering
const getAllTransactions = async (req, res, next) => {
    try {

        const transactions = await getTransactions(req.query)
        success(res, transactions, 'Transactions retrieved successfully')

    } catch (err) {

        next(err)

    }
}

//get transaction by id
const getById = async (req, res, next) => {
    try {

        const transaction = await getTransactionById(req.params.id)
        success(res, transaction, 'Transaction retrieved successfully')

    } catch (err) {

        next(err)

    }
}

//update
const update = async (req, res, next) => {
    try {

        const transaction = await updateTransaction(req.params.id, req.body)
        success(res, transaction, 'Transaction updated successfully')

    } catch (err) {

        next(err)

    }
}

//soft delete
const softDelete = async (req, res, next) => {
    try {

        await softDeleteTransaction(req.params.id)
        success(res, null, 'Transaction deleted successfully')

    } catch (err) {

        next(err);
        
    }
}

module.exports = {createTransaction, getAllTransactions, getById, update, softDelete}