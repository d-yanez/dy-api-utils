const { generateLabelPdf, formatAmount } = require('../pdf/envios-parahoy-label.generator');
const { sendMail } = require('../email/mailer');
const logger = require('../logging/logger');

function sanitizeFileFragment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'label';
}

async function handleSingleLabel(item) {
  const pdfBuffer = await generateLabelPdf(item);
  const amountLabel = formatAmount(item.amount);
  const subject = `ENVIOSPARAHOY - ${item.name} - ${item.commune} - ${amountLabel}`;

  const filename = `ENVIOSPARAHOY_${sanitizeFileFragment(item.name)}_${sanitizeFileFragment(
    item.commune
  )}_${String(item.amount || 0)}.pdf`;

  await sendMail({
    subject,
    text: '',
    attachments: [
      {
        filename,
        content: pdfBuffer
      }
    ]
  });

  logger.info({ subject }, 'EnviosParaHoy label enviada');
}

function scheduleLabelEmails(items) {
  logger.info({ total: items.length }, 'EnviosParaHoy: programando envíos');
  items.forEach((item) => {
    logger.info(
      { name: item.name, commune: item.commune },
      'EnviosParaHoy: etiqueta en cola'
    );
    setImmediate(async () => {
      try {
        logger.info(
          { name: item.name, commune: item.commune },
          'EnviosParaHoy: generando PDF y enviando correo'
        );
        await handleSingleLabel(item);
      } catch (err) {
        logger.error(
          'EnviosParaHoy label falló',
          { error: err.message, stack: err.stack, name: item.name, commune: item.commune }
        );
      }
    });
  });
}

module.exports = {
  scheduleLabelEmails
};
