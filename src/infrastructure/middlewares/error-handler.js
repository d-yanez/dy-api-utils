const logger = require('../logging/logger');

module.exports = (err, req, res, next) => {
  logger.error({ msg: 'Unhandled Error', err: err.message, stack: err.stack });
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: true,
    message: err.publicMessage || 'Internal Server Error'
  });
};
