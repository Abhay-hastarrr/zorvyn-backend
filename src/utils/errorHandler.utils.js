const errorHandler = (err, req, res, next)=>{
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server error';

    //mongoose validation error
    if(err.name ==='validationError'){
        statusCode = 400;
        message = Object.values(err.errors)
        .map(e=>e.message)
        .join(',')
    }

    //castError when invalid object is passed in req params
    if(err.name === 'CastError'){
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    //duplicate value error (when email already exists in db)
    if(err.code === 11000){
        statusCode = 409
        const field = Object.keys(err.keyValue);
        message = `${field} already exists`
    }

    //JWT Invalid
    if(err.name === 'JsonWebTokenError'){
        statusCode = 401;
        message = 'Invalid token';
    }

    //JWT expired
    if(err.name === 'TokenExpiredError'){
        statusCode = 401;
        message = 'Token expired, Please login again';
    }

    res.status(statusCode).json({
        success: false,
        message
    });

}

module.exports = errorHandler;