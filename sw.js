/**
 * HiRO service worker — handles Web Push notifications.
 */

self.addEventListener("push", (event) => {
  let payload = {
    title: "HiRO",
    body: "You have a new update from Hearts in Rhythm Organization.",
    url: "./",
    category: "general",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "HiRO Circle Logo.png",
    badge: "HiRO Circle Logo.png",
    tag: payload.category || "hiro-notification",
    renotify: true,
    data: {
      url: payload.url || "./",
      category: payload.category || "general",
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "./";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.registration.scope) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
