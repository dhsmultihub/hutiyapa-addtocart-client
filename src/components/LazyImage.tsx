import React, { useState, useRef, useEffect } from 'react'

export interface LazyImageProps {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    placeholder?: string
    blurDataURL?: string
    priority?: boolean
    quality?: number
    sizes?: string
    loading?: 'lazy' | 'eager'
    onLoad?: () => void
    onError?: () => void
    fallback?: string
    webp?: boolean
    avif?: boolean
}

export default function LazyImage({
    src,
    alt,
    width,
    height,
    className = '',
    placeholder,
    blurDataURL,
    priority = false,
    quality = 75,
    sizes = '100vw',
    loading = 'lazy',
    onLoad,
    onError,
    fallback = '/images/placeholder.jpg',
    webp = true,
    avif = true,
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isInView, setIsInView] = useState(priority)
    const [hasError, setHasError] = useState(false)
    const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder || blurDataURL)

    const imgRef = useRef<HTMLImageElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)

    // Generate optimized image sources
    const generateOptimizedSrc = (originalSrc: string, format: 'webp' | 'avif' | 'original' = 'original') => {
        if (!originalSrc) return originalSrc

        // If it's already an optimized image or external URL, return as is
        if (originalSrc.includes('_next/image') || originalSrc.startsWith('http')) {
            return originalSrc
        }

        // For local images, we would typically use Next.js Image Optimization API
        // This is a simplified version for demonstration
        const baseUrl = originalSrc.split('?')[0]
        const params = new URLSearchParams()

        if (width) params.set('w', width.toString())
        if (height) params.set('h', height.toString())
        if (quality) params.set('q', quality.toString())
        if (format !== 'original') params.set('f', format)

        return `${baseUrl}?${params.toString()}`
    }

    // Get the best supported format
    const getBestFormat = () => {
        if (typeof window === 'undefined') return 'original'

        const canvas = document.createElement('canvas')
        if (avif && canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
            return 'avif'
        }
        if (webp && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
            return 'webp'
        }
        return 'original'
    }

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || isInView) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true)
                        observer.unobserve(entry.target)
                    }
                })
            },
            {
                rootMargin: '50px',
                threshold: 0.1,
            }
        )

        if (imgRef.current) {
            observer.observe(imgRef.current)
            observerRef.current = observer
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [priority, isInView])

    // Load image when in view
    useEffect(() => {
        if (!isInView || isLoaded || hasError) return

        const img = new Image()
        const format = getBestFormat()
        const optimizedSrc = generateOptimizedSrc(src, format)

        img.onload = () => {
            setCurrentSrc(optimizedSrc)
            setIsLoaded(true)
            onLoad?.()
        }

        img.onerror = () => {
            setHasError(true)
            setCurrentSrc(fallback)
            onError?.()
        }

        img.src = optimizedSrc
    }, [isInView, src, fallback, onLoad, onError, isLoaded, hasError])

    // Cleanup observer
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [])

    const imageStyle = {
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0.7,
    }

    return (
        <div
            ref={imgRef}
            className={`relative overflow-hidden ${className}`}
            style={imageStyle}
        >
            {/* Placeholder/Blur */}
            {!isLoaded && (placeholder || blurDataURL) && (
                <div
                    className="absolute inset-0 bg-gray-200 animate-pulse"
                    style={{
                        backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: blurDataURL ? 'blur(10px)' : undefined,
                    }}
                />
            )}

            {/* Main Image */}
            <img
                src={currentSrc}
                alt={alt}
                width={width}
                height={height}
                sizes={sizes}
                loading={loading}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{
                    width: width ? `${width}px` : '100%',
                    height: height ? `${height}px` : 'auto',
                }}
            />

            {/* Loading Spinner */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                    <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Failed to load image</p>
                    </div>
                </div>
            )}
        </div>
    )
}
