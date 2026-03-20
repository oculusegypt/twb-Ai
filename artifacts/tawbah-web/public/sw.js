const ICON = '/images/logo.png';
const BADGE = '/images/logo.png';
const APP_NAME = 'دليل التوبة النصوح';

// Active notification timers
const activeTimers = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// ── Handle messages from the app ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  if (type === 'SCHEDULE_NOTIFICATIONS') {
    const { notifications } = event.data;
    scheduleNotifications(notifications);
  }

  if (type === 'CLEAR_ALL') {
    clearAllTimers();
  }

  if (type === 'PING') {
    event.ports[0]?.postMessage({ type: 'PONG' });
  }
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (url !== '/') client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Scheduling logic ──────────────────────────────────────────────────────────
function clearAllTimers() {
  for (const id of activeTimers.values()) clearTimeout(id);
  activeTimers.clear();
}

function scheduleNotifications(notifications) {
  clearAllTimers();
  const now = Date.now();

  for (const notif of notifications) {
    const delay = notif.fireAt - now;
    if (delay <= 0) continue;
    if (delay > 24 * 60 * 60 * 1000) continue; // max 24h

    const timerId = setTimeout(() => {
      self.registration.showNotification(notif.title, {
        body: notif.body,
        icon: ICON,
        badge: BADGE,
        tag: notif.tag,
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        data: { url: notif.url || '/' },
        silent: false,
      });
      activeTimers.delete(notif.tag);
    }, delay);

    activeTimers.set(notif.tag, timerId);
  }
}
