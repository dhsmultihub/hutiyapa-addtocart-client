import React, { useState, useEffect } from 'react'

export interface UpdateAvailableProps {
    className?: string
    onUpdate?: () => void
    onDismiss?: () => void
    autoShow?: boolean
    showDelay?: number
    autoHide?: boolean
    hideDelay?: number
}

export default function UpdateAvailable({
    className = '',
    onUpdate,
    onDismiss,
    autoShow = true,
    showDelay = 1000,
    autoHide = true,
    hideDelay = 10000,
}: UpdateAvailableProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            const handleServiceWorkerUpdate = (event: any) => {
                console.log('Service worker update available:', event)
                setUpdateAvailable(true)

                if (autoShow) {
                    setTimeout(() => {
                        setIsVisible(true)
                    }, showDelay)
                }
            }

            // Check for existing service worker
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration) {
                    registration.addEventListener('updatefound', handleServiceWorkerUpdate)
                }
            })

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    setUpdateAvailable(true)
                    if (autoShow) {
                        setTimeout(() => {
                            setIsVisible(true)
                        }, showDelay)
                    }
                }
            })

            // Auto-hide after delay
            if (autoHide && hideDelay > 0) {
                const timer = setTimeout(() => {
                    setIsVisible(false)
                    onDismiss?.()
                }, hideDelay)

                return () => {
                    clearTimeout(timer)
                }
            }
        }
    }, [autoShow, showDelay, autoHide, hideDelay, onDismiss])

    const handleUpdate = async () => {
        setIsUpdating(true)

        try {
            // Get service worker registration
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

            onUpdate?.()
        } catch (error) {
            console.error('Failed to update:', error)
            setIsUpdating(false)
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        onDismiss?.()
    }

    // Don't show if not visible or no update available
    if (!isVisible || !updateAvailable) {
        return null
    }

    return (
        <div className={`fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto ${className}`}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-blue-900">
                            Update Available
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                            A new version of the app is available. Update now to get the latest features and improvements.
                        </p>

                        <div className="flex items-center space-x-2 mt-3">
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Update Now
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
