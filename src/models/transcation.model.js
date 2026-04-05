const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount:{
        type: Number,
        required: true,
        min: 0
    },
    type:{
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    category:{
        type:String,
        required: true
    },
    date:{
        type: Date,
        required: true
    },
    notes:{
        type: String,
        default: ''
    },
    isDeleted:{
        type: Boolean,
        default: false      
    },
           
},{timestamps: true})

const transactionModel = mongoose.model('Transaction',transactionSchema);

module.exports = transactionModel;