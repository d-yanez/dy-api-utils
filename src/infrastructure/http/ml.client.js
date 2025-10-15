const { makeClient } = require('./axios');
const config = require('../config/config');

const client = makeClient(config.mlApi.baseURL, {
  'api-key': config.mlApi.apiKey
});

// sku "3134785108" -> "MLC3134785108"
function toItemIdFromSku(sku) {
  return `MLC${sku}`;
}

function httpsify(u) {
  if (!u) return null;
  // fuerza https cuando venga con http
  return u.replace(/^http:\/\//i, 'https://');
}

async function getMlItemBySku(sku) {
  const itemId = toItemIdFromSku(sku);
  const url = `/ml/${encodeURIComponent(config.mlApi.accountId)}/items/${encodeURIComponent(itemId)}`;
  const { data } = await client.get(url);

  const pic0 = Array.isArray(data.pictures) && data.pictures.length > 0 ? data.pictures[0] : null;

  // Orden de preferencia robusto
  const rawImage =
    (pic0 && (pic0.secure_url || pic0.url)) ||
    data.secure_thumbnail ||
    data.thumbnail ||
    null;

  const image = httpsify(rawImage);

  return {
    id: data.id,
    title: data.title,
    image,
    url: data.permalink || null
  };
}

module.exports = { getMlItemBySku };
