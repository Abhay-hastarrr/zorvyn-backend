const { registerUser, loginUser} = require('../services/user.service');
const { success } = require('../utils/apiResponse.utils')

// cookie options (aligned with JWT_EXPIRES_IN=1h)
const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hour
}

//register controller
const register = async (req, res, next) => {
    try {
        const { user, token } = await registerUser(req.body)

        res.cookie('token', token, cookieOptions);

        success(res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }, 'user registered successfully', 201)
    } catch (err) {
        next(err)
    }
}

//login controller
const login = async (req, res, next) => {
    try {
        const { user, token } = await loginUser(req.body)

        res.cookie('token', token, cookieOptions)

        success(res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }, 'Logged in successfully')

    } catch (err) {
        next(err)
    }
}

// Logout
const logout = (req, res) => {
    res.clearCookie('token')
    success(res, null, 'Logged out successfully')
}




module.exports = { register, login, logout}

