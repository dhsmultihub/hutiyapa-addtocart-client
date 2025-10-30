import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Using system fonts for faster loading - no Google Fonts dependency

// Enhanced metadata for SEO
export const metadata: Metadata = {
  title: {
    default: 'E-commerce Cart - Add to Cart System',
    template: '%s | E-commerce Cart'
  },
  description: 'Enterprise-grade e-commerce frontend with advanced cart management, real-time updates, and seamless user experience. Built with Next.js 14, React 18, Redux Toolkit, and TypeScript.',
  keywords: [
    'ecommerce',
    'shopping cart',
    'add to cart',
    'online store',
    'react',
    'nextjs',
    'typescript',
    'redux'
  ],
  authors: [{ name: 'VC', url: 'https://github.com/programmerviva' }],
  creator: 'VC (programmerviva)',
  publisher: 'E-commerce Cart System',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'E-commerce Cart - Add to Cart System',
    description: 'Enterprise-grade e-commerce frontend with advanced cart management and real-time updates.',
    siteName: 'E-commerce Cart',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'E-commerce Cart System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-commerce Cart - Add to Cart System',
    description: 'Enterprise-grade e-commerce frontend with advanced cart management and real-time updates.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased font-sans">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Providers>
      </body>
    </html>
  )
}