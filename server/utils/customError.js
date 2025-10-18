class CustomError extends Error {
    constructor({ statusCode, errorCode, title, message }) {
        super(message);
        this.title = title; // user-facing
        this.name = 'CustomError';
        this.statusCode = statusCode;
        this.errorCode = errorCode; // internal
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default CustomError;