import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from 'react-hot-toast'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

// Pages
import Landing from './pages/Landing'

// Auth Pages
import AuthCallback from './pages/auth/AuthCallback'
import ConfirmEmail from './pages/auth/ConfirmEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// App Pages
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Gallery from './pages/Gallery'
import Social from './pages/Social'
import Analytics from './pages/Analytics'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient()

export default function App() {
  console.log('🚀 ClipsForge: Inicializando aplicação...')
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              
              {/* Legacy redirects */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/editor/:videoId"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/gallery"
                element={
                  <ProtectedRoute>
                    <Gallery />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/social"
                element={
                  <ProtectedRoute>
                    <Social />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
