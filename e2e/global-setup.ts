import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('Setting up global test environment...')
  
  // Start browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for application to be ready
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Set up test data if needed
    await setupTestData(page)
    
    // Set up authentication if needed
    await setupAuthentication(page)
    
    console.log('Global setup completed successfully')
  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any) {
  console.log('Setting up test data...')
  
  // Mock API responses for consistent testing
  await page.route('**/api/v1/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [
          {
            id: '1',
            name: 'Test Product 1',
            price: 99.99,
            description: 'Test product 1 description',
            image: 'https://example.com/image1.jpg',
            category: 'Electronics',
            brand: 'Test Brand',
            inStock: true,
            stock: 100,
            rating: 4.5,
            reviewCount: 10,
          },
          {
            id: '2',
            name: 'Test Product 2',
            price: 149.99,
            description: 'Test product 2 description',
            image: 'https://example.com/image2.jpg',
            category: 'Electronics',
            brand: 'Test Brand',
            inStock: true,
            stock: 50,
            rating: 4.2,
            reviewCount: 5,
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      }),
    })
  })
  
  await page.route('**/api/v1/cart', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        subtotal: 0,
        total: 0,
        itemCount: 0,
        isEmpty: true,
      }),
    })
  })
  
  await page.route('**/api/v1/cart/add', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Item added to cart',
      }),
    })
  })
  
  await page.route('**/api/v1/cart/update', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Cart updated',
      }),
    })
  })
  
  await page.route('**/api/v1/cart/remove', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Item removed from cart',
      }),
    })
  })
  
  await page.route('**/api/v1/cart/clear', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Cart cleared',
      }),
    })
  })
  
  console.log('Test data setup completed')
}

async function setupAuthentication(page: any) {
  console.log('Setting up authentication...')
  
  // Mock authentication endpoints
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isEmailVerified: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      }),
    })
  })
  
  await page.route('**/api/v1/auth/register', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '2',
          email: 'newuser@example.com',
          firstName: 'New',
          lastName: 'User',
          isEmailVerified: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      }),
    })
  })
  
  console.log('Authentication setup completed')
}

export default globalSetup
