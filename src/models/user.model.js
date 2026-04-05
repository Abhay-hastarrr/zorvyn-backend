const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,   
        select: false,
        required: true
    },
    role: {
        type: String,
        enum: ['viewer', 'admin', 'analyst'],
        default: 'viewer'
    },
    is_Active: {
        type: Boolean,
        default: true
    }
    
},{ timestamps: true }) 

const userModel = mongoose.model('User',userSchema);

module.exports = userModel;