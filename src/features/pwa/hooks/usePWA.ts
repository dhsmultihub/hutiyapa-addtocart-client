import { useState, useEffect, useCallback } from 'react'

export interface PWAStatus {
    isInstalled: boolean
    isInstallable: boolean
    isOnline: boolean
    isUpdateAvailable: boolean
    isServiceWorkerSupported: boolean
    isPushSupported: boolean
    isBackgroundSyncSupported: boolean
    isIndexedDBSupported: boolean
    isWebAppManifestSupported: boolean
}

export interface PWAFeatures {
    canInstall: boolean
    canUpdate: boolean
    canUseOffline: boolean
    canUsePush: boolean
    canUseBackgroundSync: boolean
    canUseIndexedDB: boolean
    canUseWebAppManifest: boolean
}

export interface UsePWAReturn {
    status: PWAStatus
    features: PWAFeatures
    install: () => Promise<void>
    update: () => Promise<void>
    checkForUpdates: () => Promise<void>
    getInstallPrompt: () => any
    isSupported: (feature: string) => boolean
}

export function usePWA(): UsePWAReturn {
    const [status, setStatus] = useState<PWAStatus>({
        isInstalled: false,
        isInstallable: false,
        isOnline: navigator.onLine,
        isUpdateAvailable: false,
        isServiceWorkerSupported: 'serviceWorker' in navigator,
        isPushSupported: 'PushManager' in window,
        isBackgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        isIndexedDBSupported: 'indexedDB' in window,
        isWebAppManifestSupported: 'onbeforeinstallprompt' in window,
    })

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    // Check if app is installed
    const checkInstallStatus = useCallback(() => {
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://')

        setStatus(prev => ({ ...prev, isInstalled }))
    }, [])

    // Check for updates
    const checkForUpdates = useCallback(async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration()
                if (registration) {
                    await registration.update()
                }
            } catch (error) {
                console.error('Failed to check for updates:', error)
            }
        }
    }, [])

    // Install app
    const install = useCallback(async () => {
        if (!deferredPrompt) {
            throw new Error('Install prompt not available')
        }

        try {
            // Show the install prompt
            deferredPrompt.prompt()

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt')
                setStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
            } else {
                console.log('User dismissed the install prompt')
            }
        } catch (error) {
            console.error('Error during installation:', error)
            throw error
        } finally {
            setDeferredPrompt(null)
        }
    }, [deferredPrompt])

    // Update app
    const update = useCallback(async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration()

                if (registration && registration.waiting) {
                    // Tell the waiting service worker to skip waiting
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' })

                    // Reload the page to use the new service worker
                    window.location.reload()
                } else {
                    // Force reload to check for updates
                    window.location.reload()
                }
            } catch (error) {
                console.error('Failed to update:', error)
                throw error
            }
        }
    }, [])

    // Get install prompt
    const getInstallPrompt = useCallback(() => {
        return deferredPrompt
    }, [deferredPrompt])

    // Check if feature is supported
    const isSupported = useCallback((feature: string): boolean => {
        switch (feature) {
            case 'serviceWorker':
                return status.isServiceWorkerSupported
            case 'push':
                return status.isPushSupported
            case 'backgroundSync':
                return status.isBackgroundSyncSupported
            case 'indexedDB':
                return status.isIndexedDBSupported
            case 'webAppManifest':
                return status.isWebAppManifestSupported
            case 'install':
                return status.isInstallable
            case 'update':
                return status.isUpdateAvailable
            case 'offline':
                return status.isServiceWorkerSupported
            default:
                return false
        }
    }, [status])

    // Get PWA features
    const features: PWAFeatures = {
        canInstall: status.isInstallable && !status.isInstalled,
        canUpdate: status.isUpdateAvailable,
        canUseOffline: status.isServiceWorkerSupported,
        canUsePush: status.isPushSupported,
        canUseBackgroundSync: status.isBackgroundSyncSupported,
        canUseIndexedDB: status.isIndexedDBSupported,
        canUseWebAppManifest: status.isWebAppManifestSupported,
    }

    // Setup event listeners
    useEffect(() => {
        // Check initial install status
        checkInstallStatus()

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setStatus(prev => ({ ...prev, isInstallable: true }))
        }

        // Listen for appinstalled event
        const handleAppInstalled = () => {
            setStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
        }

        // Listen for online/offline events
        const handleOnline = () => {
            setStatus(prev => ({ ...prev, isOnline: true }))
        }

        const handleOffline = () => {
            setStatus(prev => ({ ...prev, isOnline: false }))
        }

        // Listen for service worker updates
        const handleServiceWorkerUpdate = () => {
            setStatus(prev => ({ ...prev, isUpdateAvailable: true }))
        }

        // Listen for messages from service worker
        const handleServiceWorkerMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                setStatus(prev => ({ ...prev, isUpdateAvailable: true }))
            }
        }

        // Add event listeners
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

            // Check for existing service worker
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration) {
                    registration.addEventListener('updatefound', handleServiceWorkerUpdate)
                }
            })
        }

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
            }
        }
    }, [checkInstallStatus])

    return {
        status,
        features,
        install,
        update,
        checkForUpdates,
        getInstallPrompt,
        isSupported,
    }
}

export default usePWA
