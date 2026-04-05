const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { error } = require('../utils/apiResponse.utils')

//genrate token with id and role
const genrateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    )
}

//Register user
const registerUser = async (data) => {
    const { name, email, password } = data;

    //check if email already exist
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        throw new Error("Email already exist");
        error.status = 409
        throw error;
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create user
    const user = await userModel.create({
        name,
        email,
        password: hashedPassword,
        role: 'viewer'
    })

    const token = genrateToken(user)
    return { user, token }
}

//login user
const loginUser = async (data) => {
    const { email, password } = data

    // find user and select password (we set select:false on model)
    const user = await userModel.findOne({ email }).select('+password')

    if (!user) {
        const error = new Error('Invalid email or password')
        error.statusCode = 401
        throw error
    }

    // check if account is active
    if (!user.is_Active) {
        const error = new Error('Your account has been deactivated.')
        error.statusCode = 403
        throw error
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        const error = new Error('Invalid email or password')
        error.statusCode = 401
        throw error
    }

    const token = genrateToken(user)
    return { user, token }
}


//get all users (admin only)
const getAllUsers = async () => {
    //inside user schema password is set to select false so it will not return password in response
    const users = await userModel.find().select('-__v')
    return users
}

//update user role (admin only)
const updateUserRole = async (userId, role) => {
    const validRoles = ['viewer', 'analyst', 'admin']

    if (!validRoles.includes(role)) {
        const error = new Error('Invalid role. Valid roles are viewer, analyst, admin')
        error.statusCode = 400
        throw error
    }

    const user = await userModel.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
    ).select('-__v')
    
    if(!user){
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    return user
}

//update user status (admin only)
const updateUserStatus = async (userId, is_Active) => {
  if (typeof is_Active !== 'boolean') {
    const error = new Error('isActive must be true or false')
    error.statusCode = 400
    throw error
  }

  const user = await userModel.findByIdAndUpdate(
    userId,
    { is_Active },
    { new: true }
  ).select('-__v')

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return user
}


module.exports = { registerUser, loginUser , getAllUsers, updateUserRole, updateUserStatus}


