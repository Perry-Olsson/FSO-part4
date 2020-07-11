const logger = require('./logger')

const requestLogger = (request, response, next) => {
    logger.info('method: ', request.method)
    logger.info('Path: ', request.path)
    logger.info('Body: ', request.body)
    logger.info('---')
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
    logger.error(error.message)
    logger.error(Object.keys(error.errors)[0])

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError')
        return response.status(400).json({ error: `The ${Object.keys(error.errors)[0]} field is missing` });
    next(error)
}

module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler
}