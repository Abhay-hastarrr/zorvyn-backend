const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema({

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedRole: {
        type: String,
        enum: ['analyst', 'admin'],
        required: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reason: {
        type: String,
        default: ''
    }

},{timestamps: true})

const RoleRequestModel = mongoose.model('RoleRequest', roleRequestSchema);

module.exports = RoleRequestModel;