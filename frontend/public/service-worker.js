self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {}
  const title = payload.title || 'Instagram Clone'
  const options = {
    body: payload.body || 'Voce tem uma nova notificacao.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: payload.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existingClient = clientsList.find((client) => client.url.includes(self.location.origin))

    if (existingClient) {
      await existingClient.focus()
      existingClient.postMessage({ type: 'navigate', url })
      return
    }

    await self.clients.openWindow(url)
  })())
})
