const success = (res, data = null, message = 'success', status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
}

const error = (res, data = null, message = 'something went wrong', status = 500) => {
    return res.status(status).json({
        success: false,
        message
    })
}

module.exports = { success, error }