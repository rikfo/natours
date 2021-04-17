const ErrorHandler = require('../utils/error-handler');

// global error handling middleware
const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new ErrorHandler(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  const message = `duplicate field value : ${value}`;
  return new ErrorHandler(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data : ${errors.join('. ')}`;
  return new ErrorHandler(message, 400);
};

const handleJWTError = () =>
  new ErrorHandler('invalid token, please login again', 401);

const handleJWTExpirationError = () =>
  new ErrorHandler('your token has expired! please login again!', 401);
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: '404 NOT FOUND',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: don't leak error details
    }
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  // B) RENDER WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
    // Programming or other unknown error: don't leak error details
  }
  // 1) Log error
  console.error('ERROR 💥', err);

  // 2) Send generic message
  return res.status(500).render('error', {
    title: 'Something went wrong',
    msg: 'please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);
  else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') {
      return sendErrorProd(handleCastErrorDB(err), req, res);
    }
    if (err.code === 11000) {
      return sendErrorProd(handleDuplicateFieldsDB(err), req, res);
    }
    if (err.name === 'ValidationError') {
      return sendErrorProd(handleValidationErrorDB(err), req, res);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendErrorProd(handleJWTError(), req, res);
    }
    if (err.name === 'TokenExpiredError') {
      return sendErrorProd(handleJWTExpirationError(), req, res);
    }
    return sendErrorProd(err, req, res);
  }
  // res.status(err.statusCode).json({
  //   status: err.status,
  //   message: err.message,
  // });
};
