const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../logging/logger');

let transporter;

function ensureTransporter() {
  if (transporter) return transporter;

  const { smtp } = config.enviosParaHoy;
  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('SMTP no configurado para EnviosParaHoy');
  }

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });

  return transporter;
}

async function sendMail({ subject, html = '', text = '', attachments = [] }) {
  const transport = ensureTransporter();
  const to = config.enviosParaHoy.recipient;
  const from = config.enviosParaHoy.from || config.enviosParaHoy.smtp.user;

  if (!to) {
    throw new Error('Destinatario EnviosParaHoy no configurado');
  }

  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments
  });

  logger.info({ to, subject }, 'EnviosParaHoy mail enviado');
}

module.exports = {
  sendMail
};
