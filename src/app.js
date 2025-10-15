const path = require('path');
const express = require('express');
const compression = require('compression');
const expressStaticGzip = require('express-static-gzip');

const security = require('./infrastructure/middlewares/security');
const errorHandler = require('./infrastructure/middlewares/error-handler');
const notFound = require('./infrastructure/middlewares/not-found');
const requestLogger = require('./infrastructure/middlewares/request-logger');

const routes = require('./interfaces/http/routes/index.routes');
const requestId = require('./infrastructure/middlewares/request-id');


const app = express();

// seguridad & logs
app.use(...security());
app.use(requestLogger);
app.use(requestId);

// vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// RUTAS (¡antes de estáticos!)
app.use('/', routes);

// estáticos (precomprimidos si existieran)
app.use(compression());
app.use('/', expressStaticGzip(path.join(__dirname, '..', 'public'), {
  enableBrotli: true,
  orderPreference: ['br', 'gz']
}));

// 404 y errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
