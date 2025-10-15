class StockEntry {
  constructor({ sku, location, stock }) {
    this.sku = String(sku);
    this.location = String(location || '');
    this.stock = Number(stock || 0);
  }
}

module.exports = StockEntry;
