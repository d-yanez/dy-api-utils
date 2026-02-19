const path = require('path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

function makeSpy(fn) {
  const spy = (...args) => {
    spy.calls.push(args);
    return fn(...args);
  };
  spy.calls = [];
  return spy;
}

function loadUseCase({ getStockBySku, getMlItemBySku, cacheGet, cacheSet }) {
  const useCasePath = path.resolve(__dirname, '../src/application/use-cases/get-stock-view.usecase.js');
  const stockPath = path.resolve(__dirname, '../src/infrastructure/http/stock.client.js');
  const mlPath = path.resolve(__dirname, '../src/infrastructure/http/ml.client.js');
  const cachePath = path.resolve(__dirname, '../src/infrastructure/cache/cache.js');

  delete require.cache[useCasePath];
  delete require.cache[stockPath];
  delete require.cache[mlPath];
  delete require.cache[cachePath];

  require.cache[stockPath] = { exports: { getStockBySku } };
  require.cache[mlPath] = { exports: { getMlItemBySku } };
  require.cache[cachePath] = {
    exports: {
      stockCache: {},
      mlCache: {},
      cacheGet,
      cacheSet
    }
  };

  return require(useCasePath);
}

test('getStockView: stock directo (sin fallback)', async () => {
  const stockList = [{ sku: '1199761843', location: 'EEDER3', stock: 2 }];
  const getStockBySku = makeSpy(async () => stockList);
  const getMlItemBySku = makeSpy(async () => ({
    id: 'MLC1199761843',
    title: 'Item',
    image: null,
    url: null,
    itemRelations: []
  }));
  const cacheGet = makeSpy(() => null);
  const cacheSet = makeSpy(() => undefined);

  const { getStockView } = loadUseCase({ getStockBySku, getMlItemBySku, cacheGet, cacheSet });
  const vm = await getStockView({ sku: '1199761843' });

  assert.equal(vm.fallbackUsed, false);
  assert.equal(vm.resolvedSku, '1199761843');
  assert.equal(vm.total, 2);
  assert.equal(vm.rows.length, 1);
});

test('getStockView: stock vacío + relations => fallback ok', async () => {
  const calls = [];
  const getStockBySku = makeSpy(async (sku) => {
    calls.push(sku);
    if (sku === '2950052906') return [];
    if (sku === '1199761843') return [{ sku, location: 'EP2', stock: 3 }];
    return [];
  });
  const getMlItemBySku = makeSpy(async () => ({
    id: 'MLC2950052906',
    title: 'Item',
    image: null,
    url: null,
    itemRelations: [{ id: 'MLC1199761843', stock_relation: 1 }]
  }));
  const cacheGet = makeSpy(() => null);
  const cacheSet = makeSpy(() => undefined);

  const { getStockView } = loadUseCase({ getStockBySku, getMlItemBySku, cacheGet, cacheSet });
  const vm = await getStockView({ sku: '2950052906' });

  assert.deepEqual(calls, ['2950052906', '1199761843']);
  assert.equal(vm.fallbackUsed, true);
  assert.equal(vm.resolvedSku, '1199761843');
  assert.equal(vm.total, 3);
});

test('getStockView: stock vacío + sin relations => sin fallback', async () => {
  const getStockBySku = makeSpy(async () => []);
  const getMlItemBySku = makeSpy(async () => ({
    id: 'MLC2950052906',
    title: 'Item',
    image: null,
    url: null,
    itemRelations: []
  }));
  const cacheGet = makeSpy(() => null);
  const cacheSet = makeSpy(() => undefined);

  const { getStockView } = loadUseCase({ getStockBySku, getMlItemBySku, cacheGet, cacheSet });
  const vm = await getStockView({ sku: '2950052906' });

  assert.equal(vm.fallbackUsed, false);
  assert.equal(vm.resolvedSku, '2950052906');
  assert.equal(vm.rows.length, 0);
});

test('getStockView: stock vacío + relations pero derived vacío => sin fallback', async () => {
  const getStockBySku = makeSpy(async () => []);
  const getMlItemBySku = makeSpy(async () => ({
    id: 'MLC2950052906',
    title: 'Item',
    image: null,
    url: null,
    itemRelations: [{ id: 'MLC1199761843', stock_relation: 1 }]
  }));
  const cacheGet = makeSpy(() => null);
  const cacheSet = makeSpy(() => undefined);

  const { getStockView } = loadUseCase({ getStockBySku, getMlItemBySku, cacheGet, cacheSet });
  const vm = await getStockView({ sku: '2950052906' });

  assert.equal(vm.fallbackUsed, false);
  assert.equal(vm.resolvedSku, '2950052906');
  assert.equal(vm.rows.length, 0);
});

test('getStockView: noCache no lee ni escribe cache', async () => {
  const getStockBySku = makeSpy(async () => []);
  const getMlItemBySku = makeSpy(async () => ({
    id: 'MLC2950052906',
    title: 'Item',
    image: null,
    url: null,
    itemRelations: []
  }));
  const cacheGet = makeSpy(() => null);
  const cacheSet = makeSpy(() => undefined);

  const { getStockView } = loadUseCase({ getStockBySku, getMlItemBySku, cacheGet, cacheSet });
  await getStockView({ sku: '2950052906', noCache: true });

  assert.equal(cacheGet.calls.length, 0);
  assert.equal(cacheSet.calls.length, 0);
});
