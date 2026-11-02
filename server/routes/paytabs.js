'use strict';

// Main Alazab API PayTabs IPN route.
// Mounted at POST /api/paytabs/ipn in server/index.js.
const { paytabsRouter } = require('../central-webhook/paytabs');
const { persistEvent, markNotification } = require('../central-webhook/store');
const { notifyEvent } = require('../central-webhook/whatsapp');

async function storeAndNotify(event) {
  const stored = await persistEvent(event);
  if (stored.storage !== 'postgres') return { ...stored, notified: false, notification_status: 'storage_unavailable' };
  if (stored.duplicate) return { ...stored, notified: false, notification_status: 'duplicate' };

  try {
    const delivery = await notifyEvent(stored.event);
    await markNotification(stored.event.id, 'sent', delivery);
    return { ...stored, notified: true, notification_status: 'sent' };
  } catch (error) {
    await markNotification(stored.event.id, 'failed', { error: error.message, data: error.response_data });
    return { ...stored, notified: false, notification_status: 'failed' };
  }
}

module.exports = paytabsRouter(storeAndNotify);
