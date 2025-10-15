require('dotenv').config();
const app = require('./app');
const logger = require('./infrastructure/logging/logger');

const PORT = Number(process.env.PORT || 8080);
const ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  logger.info({ msg: `dy-api-utils listening on port ${PORT}`, env: ENV });
});
