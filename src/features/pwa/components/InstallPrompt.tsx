import React, { useState, useEffect } from 'react'

export interface InstallPromptProps {
    className?: string
    onInstall?: () => void
    onDismiss?: () => void
    showAfterDelay?: number
    autoHide?: boolean
    hideDelay?: number
}

export default function InstallPrompt({
    className = '',
    onInstall,
    onDismiss,
    showAfterDelay = 3000,
    autoHide = true,
    hideDelay = 10000,
}: InstallPromptProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstalling, setIsInstalling] = useState(false)

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)

            // Show prompt after delay
            setTimeout(() => {
                setIsVisible(true)
            }, showAfterDelay)
        }

        // Listen for appinstalled event
        const handleAppInstalled = () => {
            setIsInstalled(true)
            setIsVisible(false)
            onInstall?.()
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        // Auto-hide after delay
        if (autoHide && hideDelay > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false)
                onDismiss?.()
            }, hideDelay)

            return () => {
                clearTimeout(timer)
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
                window.removeEventListener('appinstalled', handleAppInstalled)
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [showAfterDelay, autoHide, hideDelay, onInstall, onDismiss])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        setIsInstalling(true)

        try {
            // Show the install prompt
            deferredPrompt.prompt()

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt')
                setIsInstalled(true)
                setIsVisible(false)
                onInstall?.()
            } else {
                console.log('User dismissed the install prompt')
                onDismiss?.()
            }
        } catch (error) {
            console.error('Error during installation:', error)
        } finally {
            setIsInstalling(false)
            setDeferredPrompt(null)
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        onDismiss?.()
    }

    // Don't show if already installed or not visible
    if (isInstalled || !isVisible || !deferredPrompt) {
        return null
    }

    return (
        <div className={`fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto ${className}`}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">
                            Install Hutiyapa Cart
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Install our app for a better shopping experience with offline support and faster access.
                        </p>

                        <div className="flex items-center space-x-2 mt-3">
                            <button
                                onClick={handleInstall}
                                disabled={isInstalling}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInstalling ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Installing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Install
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
