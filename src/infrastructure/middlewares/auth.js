const crypto = require('crypto');

function parseKeys() {
  const raw = process.env.UTILS_API_KEYS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
const allowedKeys = parseKeys();

const SIGNING_SECRET = process.env.SIGNING_SECRET || 'change-me-secret';
const SIGNING_PREFIX = (process.env.SIGNING_PREFIX || 'dys').trim();
const SIGNING_TAGS = (process.env.SIGNING_TAGS || 'dys').split(',').map(s => s.trim()).filter(Boolean);

function hmac(input) {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(input).digest('base64url');
}

function signLegacy({ sku, exp }) {
  const payload = `sku=${sku}&exp=${exp}`;
  const sig = hmac(payload);
  return { payload, sig };
}

function verifyLegacy(sku, exp, sig) {
  if (!sku || !exp || !sig) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Number(exp) <= now) return false;
  const { sig: expected } = signLegacy({ sku, exp });
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function makeToken({ sku, exp, tags = SIGNING_TAGS }) {
  const header = `${SIGNING_PREFIX}.v1`;
  const payloadObj = { sku: String(sku), exp: Number(exp), tags };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = hmac(`${header}.${payloadB64}`);
  return `${header}.${payloadB64}.${sig}`;
}

function parseAndVerifyToken(token, pathSku) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [prefix, ver, payloadB64, sig] = parts;
  if (prefix !== SIGNING_PREFIX || ver !== 'v1') return false;

  const expected = hmac(`${prefix}.${ver}.${payloadB64}`);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch { return false; }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (Number(payload.exp) <= now) return false;
  if (String(payload.sku) !== String(pathSku)) return false;

  return true;
}

function requireApiKey(req, res, next) {
  const key = req.header('x-utils-key');
  if (!key) return res.status(401).json({ error: true, message: 'Missing x-utils-key' });
  if (!allowedKeys.includes(key)) return res.status(403).json({ error: true, message: 'Invalid key' });
  next();
}

function requireKeyOrSignedLink(req, res, next) {
  const key = req.header('x-utils-key');
  if (key && allowedKeys.includes(key)) return next();

  const { t, exp, sig } = req.query;
  const { sku } = req.params || {};
  if (t && parseAndVerifyToken(t, sku)) return next();
  if (verifyLegacy(sku, exp, sig)) return next();

  return res.status(401).json({ error: true, message: 'Unauthorized' });
}

function generateSignedPathForSku(sku, expSecondsFromNow = 3600, useCompactToken = true) {
  const exp = Math.floor(Date.now() / 1000) + Number(expSecondsFromNow);
  if (useCompactToken) {
    const t = makeToken({ sku, exp });
    return `/stock/view/${sku}?t=${encodeURIComponent(t)}`;
  } else {
    const { sig } = signLegacy({ sku, exp });
    return `/stock/view/${sku}?exp=${exp}&sig=${sig}`;
  }
}

module.exports = {
  requireApiKey,
  requireKeyOrSignedLink,
  generateSignedPathForSku,
  makeToken,
  parseAndVerifyToken
};