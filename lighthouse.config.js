module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:3000/',
                'http://localhost:3000/products',
                'http://localhost:3000/categories/electronics',
                'http://localhost:3000/cart',
                'http://localhost:3000/checkout',
            ],
            startServerCommand: 'npm run start',
            startServerReadyPattern: 'ready on',
            startServerReadyTimeout: 30000,
            numberOfRuns: 3,
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:best-practices': ['error', { minScore: 0.9 }],
                'categories:seo': ['error', { minScore: 0.9 }],
                'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'speed-index': ['error', { maxNumericValue: 3000 }],
                'total-blocking-time': ['error', { maxNumericValue: 300 }],
                'interactive': ['error', { maxNumericValue: 4000 }],
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
