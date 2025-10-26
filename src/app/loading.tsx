import { Suspense } from 'react'
import LoadingSpinner from '@/components/ui/loading-spinner'

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Suspense fallback={<LoadingSpinner />}>
                <LoadingSpinner />
            </Suspense>
        </div>
    )
}
