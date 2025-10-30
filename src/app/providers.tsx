'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '../store'
import { PersistErrorBoundary } from '../components/PersistErrorBoundary'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Render without PersistGate on server to avoid hydration issues
  if (!isClient) {
    return (
      <Provider store={store}>
        {children}
      </Provider>
    )
  }

  return (
    <PersistErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
        >
          {children}
        </PersistGate>
      </Provider>
    </PersistErrorBoundary>
  )
}