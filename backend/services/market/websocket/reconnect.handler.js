// services/market/websocket/reconnect.handler.js
// ── RECONNECT HANDLER UTILITY ──

const { WS_RECONNECT } = require('../constants');

/**
 * Creates a reconnect scheduler with exponential backoff
 */
function createReconnectScheduler(onReconnect) {
  let attempts = 0;
  let timer = null;

  function schedule(label) {
    if (attempts >= WS_RECONNECT.MAX_ATTEMPTS) {
      console.error(`[Reconnect] Max attempts reached for ${label}`);
      return;
    }

    const delay = Math.min(
      WS_RECONNECT.INITIAL_DELAY * Math.pow(WS_RECONNECT.MULTIPLIER, attempts),
      WS_RECONNECT.MAX_DELAY
    );
    attempts++;

    console.log(`[Reconnect] Attempt ${attempts} for ${label} in ${delay}ms`);
    timer = setTimeout(() => {
      onReconnect();
    }, delay);
  }

  function reset() {
    attempts = 0;
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  return { schedule, reset, cancel };
}

module.exports = { createReconnectScheduler };