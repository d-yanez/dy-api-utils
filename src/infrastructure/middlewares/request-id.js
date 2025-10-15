// antes: const { v4: uuidv4 } = require('uuid');
const { randomUUID } = require('crypto');
const { runWithContext, setContextValue } = require('../observability/als');

function requestIdMiddleware(req, res, next) {
  const requestId = req.header('x-request-id') || randomUUID(); // 👈 nativo
  runWithContext({ requestId }, () => {
    req.id = requestId;
    res.set('X-Request-Id', requestId);
    setContextValue('requestId', requestId);
    next();
  });
}

module.exports = requestIdMiddleware;