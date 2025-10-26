import { test, expect } from '@playwright/test'

test.describe('Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/cart')
    
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.getByText('Continue Shopping')).toBeVisible()
  })

  test('should add item to cart from product page', async ({ page }) => {
    // Navigate to product page
    await page.goto('/products')
    
    // Click on first product
    await page.click('[data-testid="product-card"]:first-child')
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify item was added
    await expect(page.getByText('Item added to cart')).toBeVisible()
    
    // Go to cart page
    await page.goto('/cart')
    
    // Verify item is in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
  })

  test('should update item quantity in cart', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Update quantity
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.fill('3')
    await quantityInput.blur()
    
    // Verify quantity was updated
    await expect(quantityInput).toHaveValue('3')
  })

  test('should remove item from cart', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Remove item
    await page.click('[data-testid="remove-item-button"]')
    
    // Verify item was removed
    await expect(page.getByText('Your cart is empty')).toBeVisible()
  })

  test('should clear entire cart', async ({ page }) => {
    // Add multiple items to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:nth-child(2)')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Clear cart
    await page.click('[data-testid="clear-cart-button"]')
    
    // Confirm clear action
    await page.click('[data-testid="confirm-clear-button"]')
    
    // Verify cart is empty
    await expect(page.getByText('Your cart is empty')).toBeVisible()
  })

  test('should calculate subtotal correctly', async ({ page }) => {
    // Add items to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:nth-child(2)')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Verify subtotal is calculated
    const subtotal = page.locator('[data-testid="cart-subtotal"]')
    await expect(subtotal).toBeVisible()
    
    // Verify total is calculated
    const total = page.locator('[data-testid="cart-total"]')
    await expect(total).toBeVisible()
  })

  test('should persist cart state across page refreshes', async ({ page }) => {
    // Add item to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Verify item is in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    
    // Refresh page
    await page.reload()
    
    // Verify item is still in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
  })

  test('should show cart count in header', async ({ page }) => {
    // Add item to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify cart count is updated in header
    const cartCount = page.locator('[data-testid="cart-count"]')
    await expect(cartCount).toHaveText('1')
  })

  test('should navigate to checkout from cart', async ({ page }) => {
    // Add item to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Click checkout button
    await page.click('[data-testid="checkout-button"]')
    
    // Verify navigation to checkout
    await expect(page).toHaveURL('/checkout')
  })

  test('should handle cart operations on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Add item to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Go to cart page
    await page.goto('/cart')
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    
    // Test mobile cart operations
    const quantityInput = page.locator('[data-testid="quantity-input"]')
    await quantityInput.fill('2')
    
    // Verify mobile cart functionality
    await expect(quantityInput).toHaveValue('2')
  })

  test('should show loading state during cart operations', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/cart/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })
    
    // Add item to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify loading state
    await expect(page.getByText('Adding to cart...')).toBeVisible()
  })

  test('should handle cart errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/cart/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      })
    })
    
    // Try to add item to cart
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify error message
    await expect(page.getByText('Failed to add item to cart')).toBeVisible()
  })
})
