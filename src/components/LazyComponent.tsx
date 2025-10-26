import React, { Suspense, lazy, ComponentType, ReactNode } from 'react'

export interface LazyComponentProps {
    component: () => Promise<{ default: ComponentType<any> }>
    fallback?: ReactNode
    delay?: number
    onLoad?: () => void
    onError?: (error: Error) => void
    retryCount?: number
    retryDelay?: number
}

export interface LazyComponentState {
    isLoaded: boolean
    hasError: boolean
    retryCount: number
}

export default function LazyComponent({
    component,
    fallback = <DefaultFallback />,
    delay = 0,
    onLoad,
    onError,
    retryCount = 3,
    retryDelay = 1000,
}: LazyComponentProps) {
    const [state, setState] = React.useState<LazyComponentState>({
        isLoaded: false,
        hasError: false,
        retryCount: 0,
    })

    const [LazyComponent, setLazyComponent] = React.useState<ComponentType<any> | null>(null)

    // Load component with retry logic
    const loadComponent = React.useCallback(async () => {
        try {
            setState(prev => ({ ...prev, hasError: false }))

            // Add delay if specified
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay))
            }

            const module = await component()
            setLazyComponent(() => module.default)
            setState(prev => ({ ...prev, isLoaded: true }))
            onLoad?.()
        } catch (error) {
            console.error('Failed to load component:', error)

            if (state.retryCount < retryCount) {
                setState(prev => ({
                    ...prev,
                    retryCount: prev.retryCount + 1,
                    hasError: false
                }))

                // Retry after delay
                setTimeout(() => {
                    loadComponent()
                }, retryDelay)
            } else {
                setState(prev => ({ ...prev, hasError: true }))
                onError?.(error as Error)
            }
        }
    }, [component, delay, onLoad, onError, retryCount, retryDelay, state.retryCount])

    // Load component on mount
    React.useEffect(() => {
        loadComponent()
    }, [loadComponent])

    // Error boundary for component errors
    const ErrorBoundary = React.useMemo(() => {
        return class extends React.Component<
            { children: ReactNode; onError?: (error: Error) => void },
            { hasError: boolean; error?: Error }
        > {
            constructor(props: any) {
                super(props)
                this.state = { hasError: false }
            }

            static getDerivedStateFromError(error: Error) {
                return { hasError: true, error }
            }

            componentDidCatch(error: Error, errorInfo: any) {
                console.error('Component error:', error, errorInfo)
                this.props.onError?.(error)
            }

            render() {
                if (this.state.hasError) {
                    return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />
                }

                return this.props.children
            }
        }
    }, [])

    // Loading state
    if (!LazyComponent) {
        return <>{fallback}</>
    }

    // Error state
    if (state.hasError) {
        return <ErrorFallback onRetry={loadComponent} />
    }

    // Render lazy component with error boundary
    return (
        <ErrorBoundary onError={onError}>
            <Suspense fallback={fallback}>
                <LazyComponent />
            </Suspense>
        </ErrorBoundary>
    )
}

// Default fallback component
function DefaultFallback() {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading component...</p>
            </div>
        </div>
    )
}

// Error fallback component
function ErrorFallback({
    error,
    onRetry
}: {
    error?: Error
    onRetry?: () => void
}) {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load component</h3>
                <p className="text-gray-500 text-sm mb-4">
                    {error?.message || 'An error occurred while loading this component.'}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                )}
            </div>
        </div>
    )
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
    component: () => Promise<{ default: ComponentType<P> }>,
    options: Omit<LazyComponentProps, 'component'> = {}
) {
    return function LazyWrapper(props: P) {
        return (
            <LazyComponent
                component={component}
                {...options}
            />
        )
    }
}

// Hook for lazy loading with intersection observer
export function useLazyLoading(options: {
    threshold?: number
    rootMargin?: string
    triggerOnce?: boolean
} = {}) {
    const [isInView, setIsInView] = React.useState(false)
    const [hasTriggered, setHasTriggered] = React.useState(false)
    const ref = React.useRef<HTMLElement>(null)

    React.useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true)
                        if (options.triggerOnce !== false) {
                            setHasTriggered(true)
                            observer.unobserve(element)
                        }
                    } else if (options.triggerOnce === false) {
                        setIsInView(false)
                    }
                })
            },
            {
                threshold: options.threshold || 0.1,
                rootMargin: options.rootMargin || '0px',
            }
        )

        observer.observe(element)

        return () => {
            observer.unobserve(element)
        }
    }, [options.threshold, options.rootMargin, options.triggerOnce])

    return { ref, isInView: isInView || hasTriggered }
}

// Utility for creating lazy components with preloading
export function createLazyComponent<P extends object>(
    importFunction: () => Promise<{ default: ComponentType<P> }>,
    options: {
        preload?: boolean
        preloadDelay?: number
    } = {}
) {
    const LazyComponent = lazy(importFunction)

    // Preload component if enabled
    if (options.preload) {
        const preloadDelay = options.preloadDelay || 2000
        setTimeout(() => {
            importFunction()
        }, preloadDelay)
    }

    return LazyComponent
}
