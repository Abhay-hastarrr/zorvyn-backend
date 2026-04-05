const { getAllUsers, updateUserRole, updateUserStatus } = require('../services/user.service');
const { success } = require('../utils/apiResponse.utils')

//get all users (admin only)
const getUsers = async (req, res, next) => {
    try {
        const users = await getAllUsers()
        success(res, users, 'Users fetched successfully')
    } catch (err) {
        next(err)
    }
}

//update role (admin only)
const updateRole = async (req, res, next) => {
    try {
        const { role } = req.body
        const user = await updateUserRole(req.params.id, role)
        success(res, user, 'user role updated successfully')
    } catch (err) {
        next(err)
    }
}

//update status
const updateStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body
        const user = await updateUserStatus(req.params.id, isActive)
        success(res, user, `User status changed to  ${isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
        next(err)
    }
}

module.exports = { getUsers, updateRole, updateStatus }