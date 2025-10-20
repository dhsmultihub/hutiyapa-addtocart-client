'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '../store'
import { PersistErrorBoundary } from '../components/PersistErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PersistErrorBoundary>
      <Provider store={store}>
        <PersistGate 
          loading={<div className="flex items-center justify-center min-h-screen">Loading...</div>} 
          persistor={persistor}
        >
          {children}
        </PersistGate>
      </Provider>
    </PersistErrorBoundary>
  )
}