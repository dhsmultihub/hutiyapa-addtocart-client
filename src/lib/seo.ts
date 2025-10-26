import { Metadata } from 'next'

interface SEOConfig {
    title: string
    description: string
    keywords: string[]
    image: string
    url: string
    type: 'website' | 'article' | 'product' | 'profile'
    siteName: string
    locale: string
    canonical?: string
    noindex?: boolean
    nofollow?: boolean
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
    twitterSite?: string
    twitterCreator?: string
    facebookAppId?: string
    ogType?: string
    ogImageWidth?: number
    ogImageHeight?: number
    ogImageAlt?: string
    articleAuthor?: string
    articlePublishedTime?: string
    articleModifiedTime?: string
    articleSection?: string
    articleTags?: string[]
    productPrice?: number
    productCurrency?: string
    productAvailability?: 'in_stock' | 'out_of_stock' | 'preorder'
    productBrand?: string
    productCategory?: string
    productRating?: number
    productReviewCount?: number
}

interface ProductSEOData {
    id: string
    name: string
    description: string
    price: number
    currency: string
    image: string
    brand: string
    category: string
    rating: number
    reviewCount: number
    availability: 'in_stock' | 'out_of_stock' | 'preorder'
    sku?: string
    gtin?: string
    mpn?: string
    condition?: 'new' | 'used' | 'refurbished'
    color?: string
    size?: string
    weight?: string
    dimensions?: string
    material?: string
    ageRange?: string
    gender?: string
    audience?: string
}

interface ArticleSEOData {
    title: string
    description: string
    image: string
    author: string
    publishedTime: string
    modifiedTime?: string
    section?: string
    tags?: string[]
    url: string
}

interface CategorySEOData {
    name: string
    description: string
    image: string
    parentCategory?: string
    productCount: number
    url: string
}

export class SEOOptimizer {
    // private static readonly DEFAULT_CONFIG: Partial<SEOConfig> = {
    //     siteName: 'Hutiyapa',
    //     locale: 'en_US',
    //     twitterCard: 'summary_large_image',
    //     twitterSite: '@hutiyapa',
    //     twitterCreator: '@hutiyapa',
    //     ogImageWidth: 1200,
    //     ogImageHeight: 630,
    //     productCurrency: 'USD',
    //     productAvailability: 'in_stock',
    // }

    static generateProductSEO(product: ProductSEOData): Metadata {
        const title = `${product.name} | ${product.brand} | Hutiyapa`
        const description = product.description || `Buy ${product.name} from ${product.brand}. ${product.category} with ${product.rating} star rating.`
        const keywords = [
            product.name,
            product.brand,
            product.category,
            'buy online',
            'e-commerce',
            'shopping',
            ...(product.color ? [product.color] : []),
            ...(product.size ? [product.size] : []),
            ...(product.material ? [product.material] : []),
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: `https://hutiyapa.com/products/${product.id}`,
                siteName: 'Hutiyapa',
                images: [
                    {
                        url: product.image,
                        width: 1200,
                        height: 630,
                        alt: product.name,
                    },
                ],
                type: 'website' as const,
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [product.image],
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: `https://hutiyapa.com/products/${product.id}`,
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
            other: {
                'product:price:amount': product.price.toString(),
                'product:price:currency': product.currency,
                'product:availability': product.availability,
                'product:brand': product.brand,
                'product:category': product.category,
                'product:rating': product.rating.toString(),
                'product:review_count': product.reviewCount.toString(),
                ...(product.sku && { 'product:sku': product.sku }),
                ...(product.gtin && { 'product:gtin': product.gtin }),
                ...(product.mpn && { 'product:mpn': product.mpn }),
                ...(product.condition && { 'product:condition': product.condition }),
                ...(product.color && { 'product:color': product.color }),
                ...(product.size && { 'product:size': product.size }),
                ...(product.weight && { 'product:weight': product.weight }),
                ...(product.dimensions && { 'product:dimensions': product.dimensions }),
                ...(product.material && { 'product:material': product.material }),
                ...(product.ageRange && { 'product:age_range': product.ageRange }),
                ...(product.gender && { 'product:gender': product.gender }),
                ...(product.audience && { 'product:audience': product.audience }),
            },
        }
    }

    static generateCategorySEO(category: CategorySEOData): Metadata {
        const title = `${category.name} Products | ${category.productCount} Items | Hutiyapa`
        const description = category.description || `Shop ${category.name} products. ${category.productCount} items available. ${category.description}`
        const keywords = [
            category.name,
            'products',
            'shop',
            'buy online',
            'e-commerce',
            'shopping',
            ...(category.parentCategory ? [category.parentCategory] : []),
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: `https://hutiyapa.com/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
                siteName: 'Hutiyapa',
                images: [
                    {
                        url: category.image,
                        width: 1200,
                        height: 630,
                        alt: category.name,
                    },
                ],
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [category.image],
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: `https://hutiyapa.com/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
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
        }
    }

    static generateArticleSEO(article: ArticleSEOData): Metadata {
        const title = `${article.title} | Hutiyapa Blog`
        const description = article.description
        const keywords = [
            article.title,
            'blog',
            'article',
            'news',
            'tips',
            'guide',
            ...(article.tags || []),
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: article.url,
                siteName: 'Hutiyapa',
                images: [
                    {
                        url: article.image,
                        width: 1200,
                        height: 630,
                        alt: article.title,
                    },
                ],
                type: 'article',
                locale: 'en_US',
                publishedTime: article.publishedTime,
                modifiedTime: article.modifiedTime,
                authors: [article.author],
                section: article.section,
                tags: article.tags,
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [article.image],
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: article.url,
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
        }
    }

    static generateHomePageSEO(): Metadata {
        const title = 'Hutiyapa - Modern E-commerce Platform'
        const description = 'Shop the latest products with advanced cart management, real-time updates, and seamless checkout experience. Free shipping on orders over $50.'
        const keywords = [
            'e-commerce',
            'online shopping',
            'products',
            'cart',
            'checkout',
            'free shipping',
            'modern',
            'responsive',
            'mobile',
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: 'https://hutiyapa.com',
                siteName: 'Hutiyapa',
                images: [
                    {
                        url: 'https://hutiyapa.com/og-image.jpg',
                        width: 1200,
                        height: 630,
                        alt: 'Hutiyapa E-commerce Platform',
                    },
                ],
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: ['https://hutiyapa.com/og-image.jpg'],
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: 'https://hutiyapa.com',
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
        }
    }

    static generateSearchPageSEO(query: string, resultCount: number): Metadata {
        const title = `Search Results for "${query}" | Hutiyapa`
        const description = `Find ${resultCount} products matching "${query}". Shop the best deals and latest products at Hutiyapa.`
        const keywords = [
            query,
            'search results',
            'products',
            'shop',
            'buy online',
            'e-commerce',
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: `https://hutiyapa.com/search?q=${encodeURIComponent(query)}`,
                siteName: 'Hutiyapa',
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary',
                title,
                description,
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: `https://hutiyapa.com/search?q=${encodeURIComponent(query)}`,
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
        }
    }

    static generateCartPageSEO(): Metadata {
        const title = 'Shopping Cart | Hutiyapa'
        const description = 'Review your items and proceed to checkout. Secure payment and fast delivery guaranteed.'
        const keywords = [
            'shopping cart',
            'checkout',
            'payment',
            'delivery',
            'secure',
            'fast',
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: 'https://hutiyapa.com/cart',
                siteName: 'Hutiyapa',
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary',
                title,
                description,
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: 'https://hutiyapa.com/cart',
            },
            robots: {
                index: false,
                follow: true,
                googleBot: {
                    index: false,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
        }
    }

    static generateCheckoutPageSEO(): Metadata {
        const title = 'Checkout | Hutiyapa'
        const description = 'Complete your purchase securely. Multiple payment options available.'
        const keywords = [
            'checkout',
            'payment',
            'purchase',
            'secure',
            'credit card',
            'paypal',
        ]

        return {
            title,
            description,
            keywords: keywords.join(', '),
            openGraph: {
                title,
                description,
                url: 'https://hutiyapa.com/checkout',
                siteName: 'Hutiyapa',
                type: 'website',
                locale: 'en_US',
            },
            twitter: {
                card: 'summary',
                title,
                description,
                creator: '@hutiyapa',
                site: '@hutiyapa',
            },
            alternates: {
                canonical: 'https://hutiyapa.com/checkout',
            },
            robots: {
                index: false,
                follow: true,
                googleBot: {
                    index: false,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
        }
    }

    static generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url,
            })),
        }
    }

    static generateProductStructuredData(product: ProductSEOData) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.image,
            brand: {
                '@type': 'Brand',
                name: product.brand,
            },
            category: product.category,
            sku: product.sku,
            gtin: product.gtin,
            mpn: product.mpn,
            condition: product.condition,
            color: product.color,
            size: product.size,
            weight: product.weight,
            dimensions: product.dimensions,
            material: product.material,
            ageRange: product.ageRange,
            gender: product.gender,
            audience: product.audience,
            offers: {
                '@type': 'Offer',
                price: product.price,
                priceCurrency: product.currency,
                availability: `https://schema.org/${product.availability === 'in_stock' ? 'InStock' : product.availability === 'out_of_stock' ? 'OutOfStock' : 'PreOrder'}`,
                seller: {
                    '@type': 'Organization',
                    name: 'Hutiyapa',
                },
            },
            aggregateRating: product.reviewCount > 0 ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
            } : undefined,
        }
    }

    static generateOrganizationStructuredData() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Hutiyapa',
            url: 'https://hutiyapa.com',
            logo: 'https://hutiyapa.com/logo.png',
            description: 'Modern e-commerce platform with advanced features',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '123 Business Street',
                addressLocality: 'New York',
                addressRegion: 'NY',
                postalCode: '10001',
                addressCountry: 'US',
            },
            contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+1-555-123-4567',
                contactType: 'customer service',
                email: 'support@hutiyapa.com',
            },
            sameAs: [
                'https://facebook.com/hutiyapa',
                'https://twitter.com/hutiyapa',
                'https://instagram.com/hutiyapa',
                'https://linkedin.com/company/hutiyapa',
            ],
        }
    }

    static generateWebsiteStructuredData() {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Hutiyapa',
            url: 'https://hutiyapa.com',
            description: 'Modern e-commerce platform with advanced features',
            potentialAction: {
                '@type': 'SearchAction',
                target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://hutiyapa.com/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
            },
        }
    }
}

