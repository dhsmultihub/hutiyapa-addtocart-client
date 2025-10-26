'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    showCloseButton?: boolean
    closeOnOverlayClick?: boolean
    className?: string
}

interface ModalHeaderProps {
    children: React.ReactNode
    className?: string
}

interface ModalBodyProps {
    children: React.ReactNode
    className?: string
}

interface ModalFooterProps {
    children: React.ReactNode
    className?: string
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    className,
}) => {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            setIsVisible(false)
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full mx-4',
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4',
                'bg-black/50 backdrop-blur-sm',
                'transition-opacity duration-300',
                isVisible ? 'opacity-100' : 'opacity-0'
            )}
            onClick={handleOverlayClick}
        >
            <div
                className={cn(
                    'relative w-full rounded-lg bg-background shadow-lg',
                    'border border-border',
                    'transform transition-all duration-300',
                    isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                    sizeClasses[size],
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || description || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 pb-4">
                        <div className="flex-1">
                            {title && (
                                <h2 className="text-lg font-semibold text-foreground">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {showCloseButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="ml-4 h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </Button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="px-6 pb-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => (
    <div className={cn('px-6 py-4 border-b border-border', className)}>
        {children}
    </div>
)

const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => (
    <div className={cn('px-6 py-4', className)}>
        {children}
    </div>
)

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
    <div className={cn('px-6 py-4 border-t border-border flex justify-end space-x-2', className)}>
        {children}
    </div>
)

export { Modal, ModalHeader, ModalBody, ModalFooter }
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps }
