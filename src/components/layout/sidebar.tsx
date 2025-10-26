'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    ShoppingBag,
    Heart,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ShoppingCart,
    Package,
    CreditCard,
    Truck,
    Star,
    HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
    className?: string
}

interface SidebarItemProps {
    href: string
    icon: React.ReactNode
    label: string
    badge?: string | number
    isActive?: boolean
    onClick?: () => void
}

interface SidebarSectionProps {
    title: string
    children: React.ReactNode
    className?: string
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    href,
    icon,
    label,
    badge,
    isActive,
    onClick,
}) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
            )}
        >
            <div className="flex-shrink-0">
                {icon}
            </div>
            <span className="flex-1 truncate">{label}</span>
            {badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    )
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
    title,
    children,
    className,
}) => {
    return (
        <div className={cn('space-y-1', className)}>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
            </h3>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    )
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    className,
}) => {
    const pathname = usePathname()

    const mainNavigation = [
        {
            href: '/',
            icon: <Home className="h-4 w-4" />,
            label: 'Home',
        },
        {
            href: '/products',
            icon: <Package className="h-4 w-4" />,
            label: 'Products',
        },
        {
            href: '/cart',
            icon: <ShoppingCart className="h-4 w-4" />,
            label: 'Cart',
            badge: '3',
        },
        {
            href: '/wishlist',
            icon: <Heart className="h-4 w-4" />,
            label: 'Wishlist',
            badge: '12',
        },
    ]

    const accountNavigation = [
        {
            href: '/profile',
            icon: <User className="h-4 w-4" />,
            label: 'Profile',
        },
        {
            href: '/orders',
            icon: <ShoppingBag className="h-4 w-4" />,
            label: 'Orders',
        },
        {
            href: '/payments',
            icon: <CreditCard className="h-4 w-4" />,
            label: 'Payments',
        },
        {
            href: '/shipping',
            icon: <Truck className="h-4 w-4" />,
            label: 'Shipping',
        },
        {
            href: '/reviews',
            icon: <Star className="h-4 w-4" />,
            label: 'Reviews',
        },
    ]

    const supportNavigation = [
        {
            href: '/help',
            icon: <HelpCircle className="h-4 w-4" />,
            label: 'Help Center',
        },
        {
            href: '/settings',
            icon: <Settings className="h-4 w-4" />,
            label: 'Settings',
        },
    ]

    const handleItemClick = () => {
        onClose()
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-background border-r border-border',
                    'transform transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    'lg:translate-x-0 lg:static lg:z-auto',
                    className
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg font-heading">E-commerce</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="lg:hidden h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Main Navigation */}
                        <SidebarSection title="Main">
                            {mainNavigation.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    badge={item.badge}
                                    isActive={pathname === item.href}
                                    onClick={handleItemClick}
                                />
                            ))}
                        </SidebarSection>

                        {/* Account Navigation */}
                        <SidebarSection title="Account">
                            {accountNavigation.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={pathname === item.href}
                                    onClick={handleItemClick}
                                />
                            ))}
                        </SidebarSection>

                        {/* Support Navigation */}
                        <SidebarSection title="Support">
                            {supportNavigation.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={pathname === item.href}
                                    onClick={handleItemClick}
                                />
                            ))}
                        </SidebarSection>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

// Mobile Sidebar Toggle Button
interface SidebarToggleProps {
    onClick: () => void
    className?: string
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
    onClick,
    className,
}) => {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={cn('lg:hidden', className)}
        >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
        </Button>
    )
}

// Sidebar Provider for managing sidebar state
interface SidebarContextType {
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    toggle: () => void
    close: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const toggle = React.useCallback(() => {
        setIsOpen(prev => !prev)
    }, [])

    const close = React.useCallback(() => {
        setIsOpen(false)
    }, [])

    const value = React.useMemo(() => ({
        isOpen,
        setIsOpen,
        toggle,
        close,
    }), [isOpen, toggle, close])

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = (): SidebarContextType => {
    const context = React.useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}

export { Sidebar, SidebarToggle, SidebarItem, SidebarSection }
export type { SidebarProps, SidebarItemProps, SidebarSectionProps, SidebarToggleProps }
