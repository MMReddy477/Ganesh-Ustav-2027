self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Ganesh Utsav 2027", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Ganesh Utsav 2027", {
      body: payload.body || "A new update from the SD Colony committee.",
      icon: "/images/ganesh-logo.png",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"));
});
