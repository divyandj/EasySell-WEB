const { getMessaging } = require('../utils/firebaseAdmin');
const { shouldSendAlert } = require('./alertRateLimiterService');

function getTopic(storeHandle) {
  return storeHandle ? `admin_orders_${storeHandle}` : 'admin_orders';
}

async function sendAlert({ storeHandle, alertType, title, body, data = {} }) {
  if (!alertType || !title || !body) return;

  const allowed = await shouldSendAlert(storeHandle || 'default', alertType);
  if (!allowed) return;

  const messaging = getMessaging();
  await messaging.send({
    notification: { title, body },
    data: {
      type: 'payment_alert',
      alertType,
      storeHandle: storeHandle || '',
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    },
    topic: getTopic(storeHandle),
  });
}

async function sendAlways({ storeHandle, alertType, title, body, data = {} }) {
  const messaging = getMessaging();
  await messaging.send({
    notification: { title, body },
    data: {
      type: 'payment_alert',
      alertType,
      storeHandle: storeHandle || '',
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    },
    topic: getTopic(storeHandle),
  });
}

module.exports = {
  sendAlert,
  sendAlways,
};
