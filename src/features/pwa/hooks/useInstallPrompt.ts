import { useState, useEffect, useCallback } from 'react'

export interface InstallPromptState {
    isAvailable: boolean
    isInstalled: boolean
    isInstalling: boolean
    canShow: boolean
    hasBeenShown: boolean
    hasBeenDismissed: boolean
}

export interface InstallPromptOptions {
    autoShow?: boolean
    showDelay?: number
    autoHide?: boolean
    hideDelay?: number
    maxShowCount?: number
    showInterval?: number
    onInstall?: () => void
    onDismiss?: () => void
    onShow?: () => void
    onHide?: () => void
}

export interface UseInstallPromptReturn {
    state: InstallPromptState
    show: () => void
    hide: () => void
    install: () => Promise<void>
    dismiss: () => void
    reset: () => void
    canShow: () => boolean
    shouldShow: () => boolean
}

export function useInstallPrompt(options: InstallPromptOptions = {}): UseInstallPromptReturn {
    const {
        autoShow = true,
        showDelay = 3000,
        autoHide = true,
        hideDelay = 10000,
        maxShowCount = 3,
        showInterval = 24 * 60 * 60 * 1000, // 24 hours
        onInstall,
        onDismiss,
        onShow,
        onHide,
    } = options

    const [state, setState] = useState<InstallPromptState>({
        isAvailable: false,
        isInstalled: false,
        isInstalling: false,
        canShow: false,
        hasBeenShown: false,
        hasBeenDismissed: false,
    })

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showCount, setShowCount] = useState(0)
    const [lastShown, setLastShown] = useState<Date | null>(null)

    // Check if app is installed
    const checkInstallStatus = useCallback(() => {
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://')

        setState(prev => ({ ...prev, isInstalled }))
    }, [])

    // Check if prompt can be shown
    const canShow = useCallback((): boolean => {
        if (state.isInstalled || state.hasBeenDismissed || !state.isAvailable) {
            return false
        }

        if (showCount >= maxShowCount) {
            return false
        }

        if (lastShown && Date.now() - lastShown.getTime() < showInterval) {
            return false
        }

        return true
    }, [state, showCount, maxShowCount, lastShown, showInterval])

    // Check if prompt should be shown
    const shouldShow = useCallback((): boolean => {
        return canShow() && !state.hasBeenShown
    }, [canShow, state.hasBeenShown])

    // Show prompt
    const show = useCallback(() => {
        if (!canShow()) return

        setState(prev => ({ ...prev, canShow: true, hasBeenShown: true }))
        setShowCount(prev => prev + 1)
        setLastShown(new Date())
        onShow?.()
    }, [canShow, onShow])

    // Hide prompt
    const hide = useCallback(() => {
        setState(prev => ({ ...prev, canShow: false }))
        onHide?.()
    }, [onHide])

    // Install app
    const install = useCallback(async () => {
        if (!deferredPrompt) {
            throw new Error('Install prompt not available')
        }

        setState(prev => ({ ...prev, isInstalling: true }))

        try {
            // Show the install prompt
            deferredPrompt.prompt()

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt')
                setState(prev => ({
                    ...prev,
                    isInstalled: true,
                    isInstalling: false,
                    canShow: false
                }))
                onInstall?.()
            } else {
                console.log('User dismissed the install prompt')
                setState(prev => ({
                    ...prev,
                    isInstalling: false,
                    canShow: false
                }))
            }
        } catch (error) {
            console.error('Error during installation:', error)
            setState(prev => ({ ...prev, isInstalling: false }))
            throw error
        } finally {
            setDeferredPrompt(null)
        }
    }, [deferredPrompt, onInstall])

    // Dismiss prompt
    const dismiss = useCallback(() => {
        setState(prev => ({
            ...prev,
            canShow: false,
            hasBeenDismissed: true
        }))
        onDismiss?.()
    }, [onDismiss])

    // Reset prompt state
    const reset = useCallback(() => {
        setState(prev => ({
            ...prev,
            hasBeenShown: false,
            hasBeenDismissed: false,
        }))
        setShowCount(0)
        setLastShown(null)
    }, [])

    // Setup event listeners
    useEffect(() => {
        // Check initial install status
        checkInstallStatus()

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setState(prev => ({ ...prev, isAvailable: true }))

            // Auto-show if enabled
            if (autoShow && shouldShow()) {
                setTimeout(() => {
                    show()
                }, showDelay)
            }
        }

        // Listen for appinstalled event
        const handleAppInstalled = () => {
            setState(prev => ({
                ...prev,
                isInstalled: true,
                canShow: false,
                isInstalling: false
            }))
            onInstall?.()
        }

        // Add event listeners
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        // Auto-hide after delay
        if (autoHide && hideDelay > 0) {
            const timer = setTimeout(() => {
                if (state.canShow) {
                    hide()
                }
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
    }, [checkInstallStatus, autoShow, shouldShow, show, showDelay, autoHide, hideDelay, state.canShow, hide, onInstall])

    // Load saved state from localStorage
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('install-prompt-state')
            if (savedState) {
                const parsed = JSON.parse(savedState)
                setShowCount(parsed.showCount || 0)
                setLastShown(parsed.lastShown ? new Date(parsed.lastShown) : null)
                setState(prev => ({
                    ...prev,
                    hasBeenShown: parsed.hasBeenShown || false,
                    hasBeenDismissed: parsed.hasBeenDismissed || false,
                }))
            }
        } catch (error) {
            console.error('Failed to load install prompt state:', error)
        }
    }, [])

    // Save state to localStorage
    useEffect(() => {
        try {
            const stateToSave = {
                showCount,
                lastShown: lastShown?.toISOString(),
                hasBeenShown: state.hasBeenShown,
                hasBeenDismissed: state.hasBeenDismissed,
            }
            localStorage.setItem('install-prompt-state', JSON.stringify(stateToSave))
        } catch (error) {
            console.error('Failed to save install prompt state:', error)
        }
    }, [showCount, lastShown, state.hasBeenShown, state.hasBeenDismissed])

    return {
        state,
        show,
        hide,
        install,
        dismiss,
        reset,
        canShow,
        shouldShow,
    }
}

export default useInstallPrompt
