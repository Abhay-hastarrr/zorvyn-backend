const jwt = require('jsonwebtoken')

//to verify token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                sucess: false,
                message: "No token. Unauthorized User "
            })
        }

        //Decrypt token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {
        next(err);
    }

}

//verify admin role
const adminAuth = [verifyToken, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Only Admin can access this resource"
        })
    }
    // user is admin, proceed
    next()
}]

//verify analyst or admin role
const analystAuth = [verifyToken, (req, res, next) => {
    if (!['admin', 'analyst'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Only Analyst can access this resource"
        })
    }
    // user is analyst or admin, proceed
    next()
}]

//any user can access
const userAuth = [verifyToken]

module.exports = { adminAuth, analystAuth, userAuth };