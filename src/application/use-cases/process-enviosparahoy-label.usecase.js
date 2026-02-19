const { scheduleLabelEmails } = require('../../infrastructure/services/envios-parahoy-label.service');
const logger = require('../../infrastructure/logging/logger');

function normalizeItem(raw, index) {
  if (!raw || typeof raw !== 'object') {
    const err = new Error(`Item ${index + 1} no es un objeto válido`);
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }

  const name = String(raw.name || '').trim();
  const address = String(raw.address || '').trim();
  const commune = String(raw.commune || '').trim();
  const phone = String(raw.phone || '').trim();
  const amount = Number(raw.amount);

  if (!name || !address || !commune || !phone || Number.isNaN(amount)) {
    const err = new Error(
      `Item ${index + 1} debe incluir name, address, commune, phone y amount numérico`
    );
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }

  return {
    name,
    address,
    depto: String(raw.depto || '').trim(),
    commune,
    phone,
    amount,
    extra: String(raw.extra || '').trim(),
    change: String(raw.change || '').trim() || 'No',
    email: String(raw.email || '').trim() || '',
    createdAt: new Date()
  };
}

async function processEnviosParaHoyLabels(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Debes enviar una lista con al menos un destinatario');
    err.status = 400;
    err.publicMessage = err.message;
    throw err;
  }

  const normalized = items.map((item, idx) => normalizeItem(item, idx));

  logger.info(
    {
      items: normalized.length,
      names: normalized.map((i) => i.name)
    },
    'EnviosParaHoy: solicitudes validadas, programando etiquetas'
  );

  scheduleLabelEmails(normalized);

  return { scheduled: normalized.length };
}

module.exports = {
  processEnviosParaHoyLabels
};
