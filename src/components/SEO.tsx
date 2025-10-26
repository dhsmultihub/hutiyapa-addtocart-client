import React from 'react'
import Head from 'next/head'

interface SEOProps {
    title?: string
    description?: string
    keywords?: string[]
    image?: string
    url?: string
    type?: 'website' | 'article' | 'product' | 'profile'
    siteName?: string
    locale?: string
    canonical?: string
    noindex?: boolean
    nofollow?: boolean
    structuredData?: any
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

const SEO: React.FC<SEOProps> = ({
    title = 'Hutiyapa E-commerce',
    description = 'Modern e-commerce platform with advanced cart management and real-time features',
    keywords = ['e-commerce', 'shopping', 'cart', 'products', 'online store'],
    image = '/og-image.jpg',
    url = 'https://hutiyapa.com',
    type = 'website',
    siteName = 'Hutiyapa',
    locale = 'en_US',
    canonical,
    noindex = false,
    nofollow = false,
    structuredData,
    twitterCard = 'summary_large_image',
    twitterSite = '@hutiyapa',
    twitterCreator = '@hutiyapa',
    facebookAppId,
    ogType,
    ogImageWidth = 1200,
    ogImageHeight = 630,
    ogImageAlt,
    articleAuthor,
    articlePublishedTime,
    articleModifiedTime,
    articleSection,
    articleTags,
    productPrice,
    productCurrency = 'USD',
    productAvailability = 'in_stock',
    productBrand,
    productCategory,
    productRating,
    productReviewCount,
}) => {
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
    const fullUrl = url.startsWith('http') ? url : `https://hutiyapa.com${url}`
    const canonicalUrl = canonical || fullUrl
    const imageUrl = image.startsWith('http') ? image : `https://hutiyapa.com${image}`
    const imageAlt = ogImageAlt || description

    const metaRobots = []
    if (noindex) metaRobots.push('noindex')
    if (nofollow) metaRobots.push('nofollow')
    if (metaRobots.length === 0) metaRobots.push('index', 'follow')

    return (
        <Head>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="robots" content={metaRobots.join(', ')} />
            <meta name="author" content="Hutiyapa Team" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#1f2937" />
            <meta name="msapplication-TileColor" content="#1f2937" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content={siteName} />

            {/* Canonical URL */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph Meta Tags */}
            <meta property="og:type" content={ogType || type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content={locale} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:width" content={ogImageWidth.toString()} />
            <meta property="og:image:height" content={ogImageHeight.toString()} />
            <meta property="og:image:alt" content={imageAlt} />
            {facebookAppId && <meta property="fb:app_id" content={facebookAppId} />}

            {/* Article Specific Meta Tags */}
            {type === 'article' && (
                <>
                    {articleAuthor && <meta property="article:author" content={articleAuthor} />}
                    {articlePublishedTime && (
                        <meta property="article:published_time" content={articlePublishedTime} />
                    )}
                    {articleModifiedTime && (
                        <meta property="article:modified_time" content={articleModifiedTime} />
                    )}
                    {articleSection && <meta property="article:section" content={articleSection} />}
                    {articleTags && articleTags.map((tag, index) => (
                        <meta key={index} property="article:tag" content={tag} />
                    ))}
                </>
            )}

            {/* Product Specific Meta Tags */}
            {type === 'product' && (
                <>
                    {productPrice && <meta property="product:price:amount" content={productPrice.toString()} />}
                    <meta property="product:price:currency" content={productCurrency} />
                    <meta property="product:availability" content={productAvailability} />
                    {productBrand && <meta property="product:brand" content={productBrand} />}
                    {productCategory && <meta property="product:category" content={productCategory} />}
                    {productRating && <meta property="product:rating" content={productRating.toString()} />}
                    {productReviewCount && (
                        <meta property="product:review_count" content={productReviewCount.toString()} />
                    )}
                </>
            )}

            {/* Twitter Card Meta Tags */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:site" content={twitterSite} />
            <meta name="twitter:creator" content={twitterCreator} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
            <meta name="twitter:image:alt" content={imageAlt} />

            {/* Additional Meta Tags */}
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="application-name" content={siteName} />
            <meta name="apple-mobile-web-app-title" content={siteName} />
            <meta name="msapplication-tooltip" content={description} />
            <meta name="msapplication-starturl" content="/" />

            {/* Favicon and Icons */}
            <link rel="icon" href="/favicon.ico" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.json" />

            {/* Structured Data */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}

            {/* Preconnect to external domains */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://www.google-analytics.com" />
            <link rel="preconnect" href="https://www.googletagmanager.com" />

            {/* DNS Prefetch */}
            <link rel="dns-prefetch" href="//fonts.googleapis.com" />
            <link rel="dns-prefetch" href="//www.google-analytics.com" />
            <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        </Head>
    )
}

export default SEO

