const RoleRequestModel = require('../models/RoleRequest.model')
const userModel = require('../models/user.model')

//create request
const createRequest = async (requesterId, requestedRole, reason) => {

    //check if user already has the same role
    const user = await userModel.findById(requesterId)

    if (user.role === requestedRole) {
        const error = new Error(`You already have the ${requestedRole} role`)
        error.status = 400
        throw error
    }

    //check if there is already a pending request for the same role
    const existingRequest = await RoleRequestModel.findOne({
        requester: requesterId,
        status: 'pending',
    })

    if (existingRequest) {
        const error = new Error(`You already have a pending request for the ${existingRequest.requestedRole} role`)
        error.status = 400
        throw error
    }

    const request = await RoleRequestModel.create({
        requester: requesterId,
        requestedRole,
        reason: reason || ''
    })
    return request
}

//get all requests (admin only)
const getAllRequests = async (data) => {
    const { status } = data

    const query = {}
    if (status) {
        query.status = status
    }

    const requests = await RoleRequestModel.find(query)
        .populate('requester', 'name email role')
        .populate('reviewedBy', 'name email role')
        .sort({ createdAt: -1 })
        .select('-__v')

    return requests
}

//]Get My Requests (current user)
const getMyRequests = async (userId) => {
  const requests = await RoleRequestModel.find({ requester: userId })
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })
    .select('-__v')

  return requests
}

//approve request (admin only)
const approveRequest = async (requestId, adminId) => {
    const request = await RoleRequestModel.findById(requestId)

    if (!request) {
        const error = new Error('Request not found')
        error.status = 404
        throw error
    }

    if (request.status !== 'pending') {
        const error = new Error(`Request already ${request.status}`)
        error.status = 400
        throw error
    }

    //update request status
    request.status = 'approved'
    request.reviewedBy = adminId
    request.reviewedAt = new Date()
    await request.save()

    //update user role
    const user = await userModel.findByIdAndUpdate(request.requester, {
        role: request.requestedRole
    })

    return await request.populate([
        { path: 'requester', select: 'name email role' },
        { path: 'reviewedBy', select: 'name email role' }
    ])
}

//reject request (admin only)
const rejectRequest = async (requestId, adminId, reason) => {
    const request = await RoleRequestModel.findById(requestId)

    if (!request) {
        const error = new Error('Request not found')
        error.status = 404
        throw error
    }

    if(request.status !== 'pending') {
        const error = new Error(`Request already ${request.status}`)
        error.status = 400
        throw error
    }

    request.status = 'rejected'
    request.reviewedBy = adminId
    request.reviewedAt = new Date()
    await request.save()

    return await request.populate([
        {path: 'requester', select: 'name email role'},
        {path: 'reviewedBy', select: 'name email'}

    ])
}

module.exports = { createRequest, getAllRequests, getMyRequests, approveRequest, rejectRequest }