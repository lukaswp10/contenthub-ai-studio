import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"

// Pages
import Index from './pages/Index'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ConfirmEmail from './pages/auth/ConfirmEmail'
import AuthCallback from './pages/auth/AuthCallback'
import ForgotPassword from './pages/auth/ForgotPassword'

// App Pages
import OnboardingPage from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Clips from './pages/Clips'
import Schedule from './pages/Schedule'
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
              <Route path="/" element={<Index />} />
              
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

              {/* Onboarding route */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/upload"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Upload />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/clips"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Clips />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/schedule"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Schedule />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect old routes to dashboard */}
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/automation"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Dashboard />
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
