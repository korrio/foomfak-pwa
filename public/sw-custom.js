// Custom service worker for handling notification events

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }
  
  // Handle notification click
  const urlToOpen = notificationData.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if the app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not found, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('push', function(event) {
  console.log('Push message received:', event);
  
  if (!event.data) {
    return;
  }
  
  const payload = event.data.json();
  const notificationTitle = payload.notification?.title || 'ฟูมฟัก';
  const notificationOptions = {
    body: payload.notification?.body || 'คุณได้รับการแจ้งเตือนใหม่',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    actions: [
      {
        action: 'open_app',
        title: 'เปิดแอป'
      },
      {
        action: 'dismiss',
        title: 'ปิด'
      }
    ],
    tag: payload.data?.tag || 'default',
    requireInteraction: false,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle background sync for offline data
self.addEventListener('sync', function(event) {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // This would trigger sync with your backend when online
      fetch('/api/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => {
        console.log('Background sync failed:', err);
      })
    );
  }
});

// Listen for messages from the main thread
self.addEventListener('message', function(event) {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Custom service worker loaded successfully');