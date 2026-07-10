self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'ProDesk', {
    body: data.body || 'You have a reminder!',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    tag: 'prodesk-reminder',
    requireInteraction: true,
    actions: [
      {action: 'snooze', title: '⏰ Snooze 15 min'},
      {action: 'dismiss', title: '✕ Dismiss'}
    ]
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if(e.action === 'snooze'){
    setTimeout(() => {
      self.registration.showNotification('ProDesk Reminder', {
        body: e.notification.body,
        icon: '/icon.png',
        vibrate: [200, 100, 200],
      });
    }, 15 * 60 * 1000);
  } else {
    e.waitUntil(clients.openWindow('/'));
  }
});

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
