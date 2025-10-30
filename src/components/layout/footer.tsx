import Link from 'next/link'
import { ShoppingCart, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-muted/50 border-t">
            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-xl font-heading">E-commerce</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your trusted partner for all your shopping needs. Quality products,
                            fast delivery, and exceptional customer service.
                        </p>
                        <div className="flex space-x-4">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Phone className="h-4 w-4 text-primary" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Customer Service</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">
                                    Shipping Info
                                </Link>
                            </li>
                            <li>
                                <Link href="/returns" className="text-muted-foreground hover:text-primary transition-colors">
                                    Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/size-guide" className="text-muted-foreground hover:text-primary transition-colors">
                                    Size Guide
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                                    Cookie Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/accessibility" className="text-muted-foreground hover:text-primary transition-colors">
                                    Accessibility
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-sm text-muted-foreground">
                        © 2024 E-commerce Cart. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Made with ❤️ by</span>
                        <Link
                            href="https://github.com/programmerviva"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                        >
                            VC
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
