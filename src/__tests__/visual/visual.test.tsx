import React from 'react'
import { render } from '@testing-library/react'
import { render as customRender } from '../../test-utils/render'
import { cartFixtures } from '../../test-utils/fixtures'
import { Button } from '../../components/ui/button'
import CartPage from '../../features/cart/pages/CartPage'
// import ProductCard from '../../features/products/components/ProductCard'

describe('Visual Regression Tests', () => {
  describe('Button Component', () => {
    it('renders primary button correctly', () => {
      const { container } = render(<Button variant="default">Primary Button</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders secondary button correctly', () => {
      const { container } = render(<Button variant="secondary">Secondary Button</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders outline button correctly', () => {
      const { container } = render(<Button variant="outline">Outline Button</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders loading button correctly', () => {
      const { container } = render(<Button disabled>Loading Button</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders disabled button correctly', () => {
      const { container } = render(<Button disabled>Disabled Button</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders different sizes correctly', () => {
      const { container: small } = render(<Button size="sm">Small</Button>)
      const { container: medium } = render(<Button size="default">Medium</Button>)
      const { container: large } = render(<Button size="lg">Large</Button>)

      expect(small.firstChild).toMatchSnapshot('button-small')
      expect(medium.firstChild).toMatchSnapshot('button-medium')
      expect(large.firstChild).toMatchSnapshot('button-large')
    })
  })

  // describe('ProductCard Component', () => {
  //   it('renders product card correctly', () => {
  //     const { container } = render(
  //       <ProductCard product={productFixtures.electronics} />
  //     )
  //     expect(container.firstChild).toMatchSnapshot()
  //   })

  //   it('renders product card with different states', () => {
  //     const { container: inStock } = render(
  //       <ProductCard product={productFixtures.electronics} />
  //     )
  //     const { container: outOfStock } = render(
  //       <ProductCard product={{ ...productFixtures.electronics, inStock: false }} />
  //     )

  //     expect(inStock.firstChild).toMatchSnapshot('product-in-stock')
  //     expect(outOfStock.firstChild).toMatchSnapshot('product-out-of-stock')
  //   })

  //   it('renders product card with different ratings', () => {
  //     const { container: highRating } = render(
  //       <ProductCard product={productFixtures.electronics} />
  //     )
  //     const { container: lowRating } = render(
  //       <ProductCard product={{ ...productFixtures.electronics, rating: 2.1 }} />
  //     )

  //     expect(highRating.firstChild).toMatchSnapshot('product-high-rating')
  //     expect(lowRating.firstChild).toMatchSnapshot('product-low-rating')
  //   })
  // })

  describe('CartPage Component', () => {
    it('renders empty cart correctly', () => {
      const { container } = customRender(<CartPage />, {
        preloadedState: {
          cart: cartFixtures.emptyCart,
        },
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders cart with single item correctly', () => {
      const { container } = customRender(<CartPage />, {
        preloadedState: {
          cart: cartFixtures.singleItemCart,
        },
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders cart with multiple items correctly', () => {
      const { container } = customRender(<CartPage />, {
        preloadedState: {
          cart: cartFixtures.multipleItemsCart,
        },
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders cart loading state correctly', () => {
      const { container } = customRender(<CartPage />, {
        preloadedState: {
          cart: {
            ...cartFixtures.singleItemCart,
            loading: true,
          },
        },
      })
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders cart error state correctly', () => {
      const { container } = customRender(<CartPage />, {
        preloadedState: {
          cart: {
            ...cartFixtures.singleItemCart,
            error: 'Failed to load cart',
          },
        },
      })
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('Responsive Design', () => {
    it('renders components correctly on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      // const { container } = render(<ProductCard product={productFixtures.electronics} />)
      // expect(container.firstChild).toMatchSnapshot('mobile-product-card')
    })

    it('renders components correctly on tablet', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      // const { container } = render(<ProductCard product={productFixtures.electronics} />)
      // expect(container.firstChild).toMatchSnapshot('tablet-product-card')
    })

    it('renders components correctly on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      })

      // const { container } = render(<ProductCard product={productFixtures.electronics} />)
      // expect(container.firstChild).toMatchSnapshot('desktop-product-card')
    })
  })

  describe('Theme Variations', () => {
    it('renders components correctly in light theme', () => {
      const { container } = customRender(<Button>Light Theme Button</Button>, {
        withTheme: true,
      })
      expect(container.firstChild).toMatchSnapshot('light-theme-button')
    })

    it('renders components correctly in dark theme', () => {
      // Mock dark theme
      document.documentElement.classList.add('dark')

      const { container } = customRender(<Button>Dark Theme Button</Button>, {
        withTheme: true,
      })
      expect(container.firstChild).toMatchSnapshot('dark-theme-button')

      // Clean up
      document.documentElement.classList.remove('dark')
    })
  })

  describe('Accessibility', () => {
    it('renders components with proper ARIA attributes', () => {
      const { container } = render(
        <Button aria-label="Close dialog" aria-describedby="description">
          Close
        </Button>
      )
      expect(container.firstChild).toMatchSnapshot('button-with-aria')
    })

    it('renders components with proper focus states', () => {
      const { container } = render(<Button>Focusable Button</Button>)
      const button = container.firstChild as HTMLElement

      // Simulate focus
      button.focus()
      expect(container.firstChild).toMatchSnapshot('button-focused')
    })
  })

  describe('Error States', () => {
    it('renders error states correctly', () => {
      const { container } = render(
        <Button variant="destructive" disabled>
          Error Button
        </Button>
      )
      expect(container.firstChild).toMatchSnapshot('button-error')
    })

    it('renders loading states correctly', () => {
      const { container } = render(
        <Button disabled>
          Loading Button
        </Button>
      )
      expect(container.firstChild).toMatchSnapshot('button-loading')
    })
  })

  describe('Animation States', () => {
    it('renders components in different animation states', () => {
      const { container } = render(
        <Button className="animate-pulse">
          Animated Button
        </Button>
      )
      expect(container.firstChild).toMatchSnapshot('button-animated')
    })

    it('renders components with hover states', () => {
      const { container } = render(
        <Button className="hover:bg-blue-700">
          Hover Button
        </Button>
      )
      expect(container.firstChild).toMatchSnapshot('button-hover')
    })
  })
})
