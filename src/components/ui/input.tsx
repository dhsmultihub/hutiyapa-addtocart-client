'use client'

import * as React from 'react'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'filled' | 'outline'
    showClearButton?: boolean
    onClear?: () => void
    containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            size = 'md',
            variant = 'default',
            showClearButton = false,
            onClear,
            containerClassName,
            disabled,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const [isFocused, setIsFocused] = React.useState(false)
        const inputRef = React.useRef<HTMLInputElement>(null)

        React.useImperativeHandle(ref, () => inputRef.current!)

        const handleClear = () => {
            if (inputRef.current) {
                inputRef.current.value = ''
                inputRef.current.focus()
                onClear?.()
            }
        }

        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword)
        }

        const inputType = type === 'password' && showPassword ? 'text' : type

        const sizeClasses = {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-3 text-sm',
            lg: 'h-12 px-4 text-base',
        }

        const variantClasses = {
            default: 'border-input bg-background',
            filled: 'border-transparent bg-muted',
            outline: 'border-2 border-input bg-transparent',
        }

        const iconSizeClasses = {
            sm: 'h-4 w-4',
            md: 'h-4 w-4',
            lg: 'h-5 w-5',
        }

        return (
            <div className={cn('space-y-2', containerClassName)}>
                {label && (
                    <label className="text-sm font-medium text-foreground">
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className={cn(
                            'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                            iconSizeClasses[size]
                        )}>
                            {leftIcon}
                        </div>
                    )}

                    <input
                        type={inputType}
                        className={cn(
                            'flex w-full rounded-md border transition-colors',
                            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                            'placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'disabled:bg-muted disabled:text-muted-foreground',
                            sizeClasses[size],
                            variantClasses[variant],
                            leftIcon && 'pl-10',
                            (rightIcon || type === 'password' || showClearButton) && 'pr-10',
                            error && 'border-destructive focus:ring-destructive',
                            isFocused && !error && 'border-primary',
                            className
                        )}
                        ref={inputRef}
                        disabled={disabled}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        {...props}
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        {type === 'password' && (
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className={cn(
                                    'text-muted-foreground hover:text-foreground transition-colors',
                                    iconSizeClasses[size]
                                )}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-full w-full" />
                                ) : (
                                    <Eye className="h-full w-full" />
                                )}
                            </button>
                        )}

                        {showClearButton && inputRef.current?.value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className={cn(
                                    'text-muted-foreground hover:text-foreground transition-colors',
                                    iconSizeClasses[size]
                                )}
                                tabIndex={-1}
                            >
                                <X className="h-full w-full" />
                            </button>
                        )}

                        {rightIcon && type !== 'password' && !showClearButton && (
                            <div className={cn(
                                'text-muted-foreground',
                                iconSizeClasses[size]
                            )}>
                                {rightIcon}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-destructive flex items-center">
                        <span className="mr-1">⚠</span>
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p className="text-sm text-muted-foreground">
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
    onSearch?: (value: string) => void
    searchButtonText?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            onSearch,
            searchButtonText = 'Search',
            className,
            ...props
        },
        ref
    ) => {
        const [searchValue, setSearchValue] = React.useState('')

        const handleSearch = () => {
            onSearch?.(searchValue)
        }

        const handleKeyPress = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleSearch()
            }
        }

        return (
            <div className="flex space-x-2">
                <Input
                    ref={ref}
                    type="text"
                    leftIcon={<Search className="h-4 w-4" />}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={cn('flex-1', className)}
                    {...props}
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    {searchButtonText}
                </button>
            </div>
        )
    }
)

SearchInput.displayName = 'SearchInput'

// Textarea Component
interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    helperText?: string
    resize?: 'none' | 'vertical' | 'horizontal' | 'both'
    containerClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            resize = 'vertical',
            containerClassName,
            ...props
        },
        ref
    ) => {
        const resizeClasses = {
            none: 'resize-none',
            vertical: 'resize-y',
            horizontal: 'resize-x',
            both: 'resize',
        }

        return (
            <div className={cn('space-y-2', containerClassName)}>
                {label && (
                    <label className="text-sm font-medium text-foreground">
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}

                <textarea
                    className={cn(
                        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                        'placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'disabled:bg-muted disabled:text-muted-foreground',
                        error && 'border-destructive focus:ring-destructive',
                        resizeClasses[resize],
                        className
                    )}
                    ref={ref}
                    {...props}
                />

                {error && (
                    <p className="text-sm text-destructive flex items-center">
                        <span className="mr-1">⚠</span>
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p className="text-sm text-muted-foreground">
                        {helperText}
                    </p>
                )}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'

export { Input, SearchInput, Textarea }
export type { InputProps, SearchInputProps, TextareaProps }
