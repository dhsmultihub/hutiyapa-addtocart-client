'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Something went wrong!
                </h1>
                <p className="text-gray-600 mb-6">
                    We're sorry, but something unexpected happened. Please try again.
                </p>
                <div className="space-y-3">
                    <Button onClick={reset} className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="w-full"
                    >
                        Go to homepage
                    </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6 text-left">
                        <summary className="cursor-pointer text-sm text-gray-500">
                            Error details (development only)
                        </summary>
                        <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                            {error.message}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    )
}
