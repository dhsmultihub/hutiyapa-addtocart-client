const CACHE_NAME = 'hutiyapa-cart-v1.0.0'
const STATIC_CACHE_NAME = 'hutiyapa-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'hutiyapa-dynamic-v1.0.0'
const API_CACHE_NAME = 'hutiyapa-api-v1.0.0'

// Cache strategies
const CACHE_STRATEGIES = {
    STATIC: 'cache-first',
    DYNAMIC: 'network-first',
    API: 'stale-while-revalidate',
    IMAGES: 'cache-first',
    FONTS: 'cache-first',
}

// Cache patterns
const CACHE_PATTERNS = {
    STATIC: [
        '/',
        '/cart',
        '/products',
        '/checkout',
        '/offline',
        '/manifest.json',
    ],
    DYNAMIC: [
        '/api/',
        '/_next/static/',
    ],
    API: [
        '/api/v1/',
    ],
    IMAGES: [
        '/images/',
        '/icons/',
        '/screenshots/',
    ],
    FONTS: [
        '/fonts/',
        'https://fonts.googleapis.com/',
        'https://fonts.gstatic.com/',
    ],
}

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...')

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                return cache.addAll(CACHE_PATTERNS.STATIC)
            }),
            // Cache dynamic assets
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                return cache.addAll(CACHE_PATTERNS.DYNAMIC)
            }),
            // Cache API responses
            caches.open(API_CACHE_NAME).then((cache) => {
                return cache.addAll(CACHE_PATTERNS.API)
            }),
        ]).then(() => {
            console.log('Service Worker: Installed successfully')
            return self.skipWaiting()
        })
    )
})

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...')

    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME &&
                            cacheName !== STATIC_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName !== API_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName)
                            return caches.delete(cacheName)
                        }
                    })
                )
            }),
            // Take control of all clients
            self.clients.claim(),
        ]).then(() => {
            console.log('Service Worker: Activated successfully')
        })
    )
})

// Fetch event
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return
    }

    // Determine cache strategy
    const strategy = getCacheStrategy(request)

    event.respondWith(
        handleRequest(request, strategy)
    )
})

// Handle different cache strategies
async function handleRequest(request, strategy) {
    try {
        switch (strategy) {
            case CACHE_STRATEGIES.STATIC:
                return await cacheFirst(request)
            case CACHE_STRATEGIES.DYNAMIC:
                return await networkFirst(request)
            case CACHE_STRATEGIES.API:
                return await staleWhileRevalidate(request)
            case CACHE_STRATEGIES.IMAGES:
                return await cacheFirst(request)
            case CACHE_STRATEGIES.FONTS:
                return await cacheFirst(request)
            default:
                return await networkFirst(request)
        }
    } catch (error) {
        console.error('Service Worker: Fetch error:', error)
        return await getOfflineResponse(request)
    }
}

// Cache first strategy
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
        return cachedResponse
    }

    try {
        const networkResponse = await fetch(request)
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone())
        }
        return networkResponse
    } catch (error) {
        return await getOfflineResponse(request)
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request)
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME)
            cache.put(request, networkResponse.clone())
        }
        return networkResponse
    } catch (error) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME)
        const cachedResponse = await cache.match(request)

        if (cachedResponse) {
            return cachedResponse
        }

        return await getOfflineResponse(request)
    }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    // Return cached response immediately
    if (cachedResponse) {
        // Update cache in background
        fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone())
            }
        }).catch(() => {
            // Ignore network errors for background updates
        })

        return cachedResponse
    }

    try {
        const networkResponse = await fetch(request)
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone())
        }
        return networkResponse
    } catch (error) {
        return await getOfflineResponse(request)
    }
}

// Get offline response
async function getOfflineResponse(request) {
    const url = new URL(request.url)

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        return new Response(
            `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Hutiyapa Cart</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .offline-container {
              text-align: center;
              max-width: 400px;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .offline-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            p {
              color: #666;
              margin-bottom: 20px;
            }
            .retry-btn {
              background: #000;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            .retry-btn:hover {
              background: #333;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
      `,
            {
                headers: {
                    'Content-Type': 'text/html',
                },
            }
        )
    }

    // Return cached API response or empty response
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
        return cachedResponse
    }

    // Return empty response for API requests
    return new Response(
        JSON.stringify({
            error: 'Offline',
            message: 'You are currently offline. Please check your connection.',
        }),
        {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    )
}

// Determine cache strategy based on request
function getCacheStrategy(request) {
    const url = new URL(request.url)

    // Static assets
    if (url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/static/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.woff2')) {
        return CACHE_STRATEGIES.STATIC
    }

    // Images
    if (url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/screenshots/') ||
        url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        return CACHE_STRATEGIES.IMAGES
    }

    // Fonts
    if (url.pathname.startsWith('/fonts/') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        return CACHE_STRATEGIES.FONTS
    }

    // API requests
    if (url.pathname.startsWith('/api/')) {
        return CACHE_STRATEGIES.API
    }

    // Default to network first
    return CACHE_STRATEGIES.DYNAMIC
}

// Background sync
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered')

    if (event.tag === 'cart-sync') {
        event.waitUntil(syncCart())
    }

    if (event.tag === 'offline-actions') {
        event.waitUntil(syncOfflineActions())
    }
})

// Push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received')

    if (event.data) {
        const data = event.data.json()

        const options = {
            body: data.body || 'You have a new notification',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: data.tag || 'default',
            data: data.data || {},
            actions: data.actions || [],
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false,
        }

        event.waitUntil(
            self.registration.showNotification(data.title || 'Hutiyapa Cart', options)
        )
    }
})

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked')

    event.notification.close()

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        )
    } else if (event.action === 'close') {
        // Handle close action
    } else {
        // Default action
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        )
    }
})

// Message handling
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data)

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                return cache.addAll(event.data.urls)
            })
        )
    }
})

// Sync cart data
async function syncCart() {
    try {
        // Get cart data from IndexedDB
        const cartData = await getCartData()

        if (cartData && cartData.items && cartData.items.length > 0) {
            // Sync with server
            const response = await fetch('/api/v1/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cartData),
            })

            if (response.ok) {
                console.log('Service Worker: Cart synced successfully')
            }
        }
    } catch (error) {
        console.error('Service Worker: Cart sync failed:', error)
    }
}

// Sync offline actions
async function syncOfflineActions() {
    try {
        // Get offline actions from IndexedDB
        const actions = await getOfflineActions()

        for (const action of actions) {
            try {
                const response = await fetch(action.url, {
                    method: action.method,
                    headers: action.headers,
                    body: action.body,
                })

                if (response.ok) {
                    // Remove action from queue
                    await removeOfflineAction(action.id)
                }
            } catch (error) {
                console.error('Service Worker: Failed to sync action:', action.id, error)
            }
        }
    } catch (error) {
        console.error('Service Worker: Offline actions sync failed:', error)
    }
}

// Helper functions for IndexedDB operations
async function getCartData() {
    // This would typically interact with IndexedDB
    return null
}

async function getOfflineActions() {
    // This would typically interact with IndexedDB
    return []
}

async function removeOfflineAction(actionId) {
    // This would typically interact with IndexedDB
    console.log('Service Worker: Removing offline action:', actionId)
}

// Update available
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        // Notify clients about update
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    payload: event.data.payload,
                })
            })
        })
    }
})

console.log('Service Worker: Loaded successfully')
