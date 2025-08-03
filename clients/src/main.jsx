import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './index.css'

// Import error tracker for development debugging
if (import.meta.env.DEV) {
  import('./utils/errorTracker.js');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        // Global error handler for React Query
        console.log('React Query error (handled silently):', error.message);
        // Don't show network error toasts here - let individual components handle if needed
      },
    },
    mutations: {
      onError: (error) => {
        // Global error handler for mutations
        console.log('React Query mutation error (handled silently):', error.message);
        // Only show error toast if it's not a network error
        if (error.response) {
          // This is a server error, not a network error
          // Individual components should handle their own error messages
        }
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider>
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    padding: '12px 16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: '#10B981',
                      color: '#fff',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#10B981',
                    },
                  },
                  error: {
                    duration: 5000,
                    style: {
                      background: '#EF4444',
                      color: '#fff',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#EF4444',
                    },
                  },
                  loading: {
                    style: {
                      background: '#3B82F6',
                      color: '#fff',
                    },
                  },
                }}
                reverseOrder={false}
              />
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
