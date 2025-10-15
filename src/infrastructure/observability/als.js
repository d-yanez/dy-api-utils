const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

function runWithContext(ctx, fn) {
  return als.run(ctx, fn);
}

function getContext() {
  return als.getStore() || {};
}

function setContextValue(key, value) {
  const ctx = als.getStore();
  if (ctx) ctx[key] = value;
}

module.exports = {
  als,
  runWithContext,
  getContext,
  setContextValue
};