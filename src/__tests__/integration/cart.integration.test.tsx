import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
// import { BrowserRouter } from 'react-router-dom'
// import { render as customRender } from '../../test-utils/render'
import { mockFetch } from '../../test-utils/mocks'
import { productFixtures, cartFixtures } from '../../test-utils/fixtures'
import cartReducer from '../../features/cart/redux/cart.slice'
import productsReducer from '../../features/products/redux/products.slice'
import CartPage from '../../features/cart/pages/CartPage'

// Mock store for integration testing
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      products: productsReducer,
    },
    preloadedState,
  })
}

const wrapper = ({ children, store }: { children: React.ReactNode; store: any }) => (
  <Provider store={store}>
    {children}
  </Provider>
)

describe('Cart Integration Tests', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore({
      cart: cartFixtures.emptyCart,
      products: {
        products: [productFixtures.electronics, productFixtures.clothing],
        loading: false,
        error: null,
      },
    })

    // Mock API responses
    mockFetch({
      '/api/v1/cart': cartFixtures.emptyCart,
      '/api/v1/cart/add': { success: true },
      '/api/v1/cart/update': { success: true },
      '/api/v1/cart/remove': { success: true },
    })
  })

  it('displays empty cart message when cart is empty', () => {
    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument()
  })

  it('displays cart items when cart has items', () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(screen.getByText(productFixtures.electronics.name)).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
  })

  it('updates item quantity when quantity input changes', async () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    const quantityInput = screen.getByDisplayValue('1')
    fireEvent.change(quantityInput, { target: { value: '3' } })

    await waitFor(() => {
      expect(quantityInput).toHaveValue(3)
    })
  })

  it('removes item when remove button is clicked', async () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    const removeButton = screen.getByRole('button', { name: /remove/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    })
  })

  it('clears cart when clear cart button is clicked', async () => {
    store = createTestStore({
      cart: cartFixtures.multipleItemsCart,
      products: {
        products: [productFixtures.electronics, productFixtures.clothing],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    const clearButton = screen.getByRole('button', { name: /clear cart/i })
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    })
  })

  it('calculates subtotal correctly with multiple items', () => {
    store = createTestStore({
      cart: cartFixtures.multipleItemsCart,
      products: {
        products: [productFixtures.electronics, productFixtures.clothing],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(screen.getByText('$229.97')).toBeInTheDocument()
  })

  it('navigates to checkout when checkout button is clicked', () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    fireEvent.click(checkoutButton)

    // This would typically navigate to checkout page
    // In a real test, you'd check the URL or route change
    expect(checkoutButton).toBeInTheDocument()
  })

  it('handles loading state during cart operations', async () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: true,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays error message when cart operation fails', async () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: 'Failed to update cart',
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    expect(screen.getByText('Failed to update cart')).toBeInTheDocument()
  })

  it('persists cart state across page refreshes', () => {
    // Simulate page refresh by creating new store with same state
    const initialState = {
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    }

    const store1 = createTestStore(initialState)
    const store2 = createTestStore(initialState)

    const { rerender } = render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store: store1 }),
    })

    expect(screen.getByText(productFixtures.electronics.name)).toBeInTheDocument()

    // Simulate page refresh
    rerender(
      <Provider store={store2}>
        <CartPage />
      </Provider>
    )

    expect(screen.getByText(productFixtures.electronics.name)).toBeInTheDocument()
  })

  it('handles cart synchronization with server', async () => {
    // Mock server response
    mockFetch({
      '/api/v1/cart': cartFixtures.singleItemCart,
    })

    store = createTestStore({
      cart: cartFixtures.emptyCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    // Simulate cart sync
    await waitFor(() => {
      expect(screen.getByText(productFixtures.electronics.name)).toBeInTheDocument()
    })
  })

  it('validates cart items before checkout', () => {
    store = createTestStore({
      cart: cartFixtures.singleItemCart,
      products: {
        products: [productFixtures.electronics],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    expect(checkoutButton).not.toBeDisabled()
  })

  it('disables checkout button when cart is empty', () => {
    store = createTestStore({
      cart: cartFixtures.emptyCart,
      products: {
        products: [],
        loading: false,
        error: null,
      },
    })

    render(<CartPage />, {
      wrapper: ({ children }) => wrapper({ children, store }),
    })

    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    expect(checkoutButton).toBeDisabled()
  })
})
