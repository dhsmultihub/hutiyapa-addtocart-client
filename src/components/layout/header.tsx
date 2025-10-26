'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Menu, X, Search, User, Heart } from 'lucide-react'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl font-heading">E-commerce</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/products"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Products
                    </Link>
                    <Link
                        href="/categories"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Categories
                    </Link>
                    <Link
                        href="/deals"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Deals
                    </Link>
                    <Link
                        href="/about"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        About
                    </Link>
                </nav>

                {/* Search Bar */}
                <div className="hidden lg:flex flex-1 max-w-sm mx-6">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-2">
                    {/* Search Button (Mobile) */}
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Wishlist */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Heart className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                            0
                        </span>
                    </Button>

                    {/* Cart */}
                    <Button variant="ghost" size="icon" className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            0
                        </span>
                    </Button>

                    {/* User Account */}
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-background">
                    <div className="container py-4 space-y-4">
                        {/* Mobile Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            />
                        </div>

                        {/* Mobile Navigation Links */}
                        <nav className="space-y-2">
                            <Link
                                href="/products"
                                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Products
                            </Link>
                            <Link
                                href="/categories"
                                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Categories
                            </Link>
                            <Link
                                href="/deals"
                                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Deals
                            </Link>
                            <Link
                                href="/about"
                                className="block py-2 text-sm font-medium transition-colors hover:text-primary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                        </nav>

                        {/* Mobile Auth Actions */}
                        <div className="pt-4 border-t space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                <User className="h-4 w-4 mr-2" />
                                Sign In
                            </Button>
                            <Button className="w-full justify-start">
                                <User className="h-4 w-4 mr-2" />
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
