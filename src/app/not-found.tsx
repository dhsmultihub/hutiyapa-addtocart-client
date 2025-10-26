'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md">
                <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Page not found
                </h1>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="space-y-3">
                    <Button asChild className="w-full">
                        <Link href="/">
                            <Home className="h-4 w-4 mr-2" />
                            Go to homepage
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="w-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go back
                    </Button>
                </div>
            </div>
        </div>
    )
}
