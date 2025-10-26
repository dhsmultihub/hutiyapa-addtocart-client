import React from 'react'

interface Product {
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

interface Organization {
    name: string
    url: string
    logo: string
    description: string
    address?: {
        street: string
        city: string
        state: string
        postalCode: string
        country: string
    }
    contactPoint?: {
        telephone: string
        contactType: string
        email?: string
    }
    sameAs?: string[]
}

interface BreadcrumbItem {
    name: string
    url: string
    position: number
}

interface Review {
    author: string
    rating: number
    reviewBody: string
    datePublished: string
    publisher?: string
}

interface FAQ {
    question: string
    answer: string
}

interface StructuredDataProps {
    type: 'product' | 'organization' | 'breadcrumb' | 'review' | 'faq' | 'website' | 'article'
    data: Product | Organization | BreadcrumbItem[] | Review | FAQ[] | any
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
    const generateStructuredData = () => {
        switch (type) {
            case 'product':
                return generateProductStructuredData(data as Product)
            case 'organization':
                return generateOrganizationStructuredData(data as Organization)
            case 'breadcrumb':
                return generateBreadcrumbStructuredData(data as BreadcrumbItem[])
            case 'review':
                return generateReviewStructuredData(data as Review)
            case 'faq':
                return generateFAQStructuredData(data as FAQ[])
            case 'website':
                return generateWebsiteStructuredData(data)
            case 'article':
                return generateArticleStructuredData(data)
            default:
                return null
        }
    }

    const generateProductStructuredData = (product: Product) => ({
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
    })

    const generateOrganizationStructuredData = (organization: Organization) => ({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organization.name,
        url: organization.url,
        logo: organization.logo,
        description: organization.description,
        address: organization.address ? {
            '@type': 'PostalAddress',
            streetAddress: organization.address.street,
            addressLocality: organization.address.city,
            addressRegion: organization.address.state,
            postalCode: organization.address.postalCode,
            addressCountry: organization.address.country,
        } : undefined,
        contactPoint: organization.contactPoint ? {
            '@type': 'ContactPoint',
            telephone: organization.contactPoint.telephone,
            contactType: organization.contactPoint.contactType,
            email: organization.contactPoint.email,
        } : undefined,
        sameAs: organization.sameAs,
    })

    const generateBreadcrumbStructuredData = (breadcrumbs: BreadcrumbItem[]) => ({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    })

    const generateReviewStructuredData = (review: Review) => ({
        '@context': 'https://schema.org',
        '@type': 'Review',
        author: {
            '@type': 'Person',
            name: review.author,
        },
        reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
        },
        reviewBody: review.reviewBody,
        datePublished: review.datePublished,
        publisher: review.publisher ? {
            '@type': 'Organization',
            name: review.publisher,
        } : undefined,
    })

    const generateFAQStructuredData = (faqs: FAQ[]) => ({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    })

    const generateWebsiteStructuredData = (data: any) => ({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: data.name || 'Hutiyapa',
        url: data.url || 'https://hutiyapa.com',
        description: data.description || 'Modern e-commerce platform',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://hutiyapa.com/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    })

    const generateArticleStructuredData = (data: any) => ({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.headline,
        description: data.description,
        image: data.image,
        author: {
            '@type': 'Person',
            name: data.author,
        },
        publisher: {
            '@type': 'Organization',
            name: data.publisher || 'Hutiyapa',
            logo: {
                '@type': 'ImageObject',
                url: data.publisherLogo || 'https://hutiyapa.com/logo.png',
            },
        },
        datePublished: data.datePublished,
        dateModified: data.dateModified,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url,
        },
    })

    const structuredData = generateStructuredData()

    if (!structuredData) return null

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}

export default StructuredData

