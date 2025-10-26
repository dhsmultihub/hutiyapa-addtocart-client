'use client'

import * as React from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
    id: string
    title?: string
    description?: string
    variant?: ToastVariant
    duration?: number
    onClose?: () => void
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

const toastVariants = {
    default: 'bg-background border-border text-foreground',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const toastIcons = {
    default: Info,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

const Toast: React.FC<ToastProps> = ({
    id,
    title,
    description,
    variant = 'default',
    duration = 5000,
    onClose,
    action,
    className,
}) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [isExiting, setIsExiting] = React.useState(false)

    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [duration])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => {
            setIsVisible(false)
            onClose?.()
        }, 150)
    }

    if (!isVisible) return null

    const Icon = toastIcons[variant]

    return (
        <div
            className={cn(
                'relative flex w-full items-center space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg',
                'transform transition-all duration-300 ease-in-out',
                isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
                toastVariants[variant],
                className
            )}
            role="alert"
            aria-live="polite"
        >
            <div className="flex-shrink-0">
                <Icon className={cn(
                    'h-5 w-5',
                    variant === 'success' && 'text-green-600',
                    variant === 'error' && 'text-red-600',
                    variant === 'warning' && 'text-yellow-600',
                    variant === 'info' && 'text-blue-600',
                    variant === 'default' && 'text-muted-foreground'
                )} />
            </div>

            <div className="flex-1 space-y-1">
                {title && (
                    <p className="text-sm font-medium">
                        {title}
                    </p>
                )}
                {description && (
                    <p className="text-sm opacity-90">
                        {description}
                    </p>
                )}
                {action && (
                    <div className="mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={action.onClick}
                            className="h-8 px-3 text-xs"
                        >
                            {action.label}
                        </Button>
                    </div>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-transparent"
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
        </div>
    )
}

// Toast Container Component
interface ToastContainerProps {
    toasts: ToastProps[]
    onRemove: (id: string) => void
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
    className?: string
}

const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onRemove,
    position = 'top-right',
    className,
}) => {
    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    }

    return (
        <div
            className={cn(
                'fixed z-50 flex flex-col space-y-2',
                positionClasses[position],
                className
            )}
        >
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    )
}

// Hook for managing toasts
interface ToastOptions {
    title?: string
    description?: string
    variant?: ToastVariant
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastManager {
    toasts: ToastProps[]
    addToast: (toast: Omit<ToastProps, 'id'>) => string
    removeToast: (id: string) => void
    clearToasts: () => void
}

const useToast = (): ToastManager => {
    const [toasts, setToasts] = React.useState<ToastProps[]>([])

    const addToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast = { ...toast, id }

        setToasts(prev => [...prev, newToast])
        return id
    }, [])

    const removeToast = React.useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const clearToasts = React.useCallback(() => {
        setToasts([])
    }, [])

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
    }
}

export { Toast, ToastContainer, useToast }
export type { ToastProps, ToastContainerProps, ToastOptions, ToastManager }
