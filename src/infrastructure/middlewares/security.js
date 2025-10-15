const helmet = require('helmet');
const cors = require('cors');
const nocache = require('nocache');
const rateLimit = require('express-rate-limit');

function security() {
  const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });

  const helmetMw = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // permitir imágenes externas (mlstatic) + https
        "img-src": ["'self'", "data:", "https:", "*.mlstatic.com", "http2.mlstatic.com"],
        // permitimos estilos inline solo mientras usamos estilos embebidos / tailwindcdn
        "style-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        // 👇 permitir scripts inline + CDN de Tailwind (necesario para el loader actual)
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        "connect-src": ["'self'", "https:"],
        "font-src": ["'self'", "data:", "https:"]
      }
    },
    crossOriginEmbedderPolicy: false
  });

  return [helmetMw, cors(), nocache(), limiter];
}

module.exports = security;