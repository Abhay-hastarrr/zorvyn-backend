const { createRequest, getAllRequests, getMyRequests,approveRequest, rejectRequest } = require('../services/roleRequest.service')
const { success } = require('../utils/apiResponse.utils')

//create request
const create = async (req, res, next) => {
    try {
        const request = await createRequest(req.user.id, req.body.requestedRole, req.body.reason)
        success(res, request, 'Role change request created successfully', 201)
    } catch (err) {
        next(err)
    }
}

//get all requests (admin only)
const getAll = async (req, res, next) => {
    try {
        const requests = await getAllRequests(req.query)
        success(res, requests, 'Role change requests retrieved successfully')
    } catch (err) {
        next(err)
    }   
}

//get my requests
const getRequests = async (req, res, next) => {
    try {
        const requests = await getMyRequests(req.user.id)
        success(res, requests, 'Your role change requests retrieved successfully')
    } catch (err) {
        next(err)
    }  
}

//approve request (admin only)
const approve = async (req, res, next) => {
    try {
        const request = await approveRequest(req.params.id, req.user.id)    
        success(res, request, 'Role change request approved successfully')
    } catch (err) {
        next(err)
    }
}

//reject request (admin only)
const reject = async (req, res, next) => {
    try {
        const request = await rejectRequest(req.params.id, req.user.id)
        success(res, request, 'Role change request rejected successfully')
    } catch (err) {
        next(err)
    }   
}

module.exports = { create, getAll, getRequests, approve, reject }