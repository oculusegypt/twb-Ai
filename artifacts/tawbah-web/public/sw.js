const ICON = '/images/logo.png';
const BADGE = '/images/logo.png';

// Active notification timers
const activeTimers = new Map();
let midnightTimer = null;

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
  if (midnightTimer !== null) {
    clearTimeout(midnightTimer);
    midnightTimer = null;
  }
}

// Broadcast to all open app windows to trigger a reschedule
function broadcastRescheduleNeeded() {
  clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      client.postMessage({ type: 'RESCHEDULE_NEEDED' });
    }
  });
}

// Schedule a timer that fires at 00:01 next day to trigger rescheduling for the new day
function scheduleMidnightReset() {
  if (midnightTimer !== null) {
    clearTimeout(midnightTimer);
    midnightTimer = null;
  }
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 1, 0, 0  // 00:01:00 next day
  );
  const delay = nextMidnight.getTime() - now.getTime();

  midnightTimer = setTimeout(() => {
    midnightTimer = null;
    broadcastRescheduleNeeded();
  }, delay);
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
      // Notify all open app windows to add this to in-app inbox
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          client.postMessage({
            type: 'NOTIFICATION_FIRED',
            tag: notif.tag,
            title: notif.title,
            body: notif.body,
            url: notif.url || '/',
          });
        }
      });
    }, delay);

    activeTimers.set(notif.tag, timerId);
  }

  // Always schedule a midnight reset so tomorrow's notifications are rescheduled
  scheduleMidnightReset();
}
