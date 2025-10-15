const { createLogger, transports, format } = require('winston');

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'info');

const devFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(({ level, message, timestamp, ...meta }) =>
    `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
  )
);

const prodFormat = format.combine(format.timestamp(), format.json());

const logger = createLogger({
  level,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [ new transports.Console() ]
});

module.exports = logger;