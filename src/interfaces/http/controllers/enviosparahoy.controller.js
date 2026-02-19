const logger = require('../../../infrastructure/logging/logger');
const { processEnviosParaHoyLabels } = require('../../../application/use-cases/process-enviosparahoy-label.usecase');

async function createLabels(req, res, next) {
  try {
    const payload = req.body;
    logger.info(
      {
        requestId: req.id,
        items: Array.isArray(payload) ? payload.length : 0
      },
      'EnviosParaHoy: request recibida'
    );

    const result = await processEnviosParaHoyLabels(payload);

    res.status(202).json({
      success: true,
      ...result
    });
  } catch (err) {
    logger.error(
      'EnviosParaHoy request failed',
      {
        requestId: req.id,
        error: err.message,
        stack: err.stack
      }
    );
    next(err);
  }
}

module.exports = {
  createLabels
};
