'use client'

import React from 'react';

interface PersistErrorBoundaryProps {
  children: React.ReactNode;
}

interface PersistErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PersistErrorBoundary extends React.Component<
  PersistErrorBoundaryProps,
  PersistErrorBoundaryState
> {
  constructor(props: PersistErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PersistErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error('Redux Persist Error:', error, errorInfo);
    
    // Clear potentially corrupted localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('persist:root');
        console.log('Cleared corrupted persist data');
      } catch (e) {
        console.error('Failed to clear persist data:', e);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Reload the page to reinitialize the store
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Application Error
            </h2>
            <p className="text-gray-700 mb-4">
              There was a problem loading the application. This might be due to corrupted data.
            </p>
            <button
              onClick={this.handleRetry}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}