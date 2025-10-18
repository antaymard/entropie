const errorHandler = (err, req, res, next) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            name: err.name || null,
            errorCode: err.errorCode || err.code || null,
            title: err.title || null,
            message: err.message || 'Une erreur est survenue',
            statusCode: err.statusCode || 500,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack
            })
        }
    });
};

export default errorHandler;