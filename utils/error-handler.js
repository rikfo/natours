class ErrorHandler extends Error {
  constructor(message, statusCode) {
    // super represent the parent class constructor which is in this case (Error)
    // then we assign its message property to the message we pass to our constructor
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;
