const { buildError } = require('../constants/paymentErrors');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runWithRetry(fn, options = {}) {
  const maxRetries = Number(options.maxRetries || 3);
  const baseDelayMs = Number(options.baseDelayMs || 80);

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isConflict = String(error.message || '').toLowerCase().includes('aborted')
        || String(error.code || '').toLowerCase().includes('aborted');

      if (!isConflict || attempt >= maxRetries) break;

      const wait = baseDelayMs * (2 ** (attempt - 1));
      await sleep(wait);
    }
  }

  if (lastError && lastError.code && lastError.httpStatus) {
    throw lastError;
  }

  throw buildError('TRANSACTION_RETRY_EXHAUSTED', {
    details: lastError ? String(lastError.message || lastError) : 'Unknown transaction retry failure',
  });
}

module.exports = {
  runWithRetry,
};
