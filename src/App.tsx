import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Index from './pages/Index'
import { LoginPage } from './pages/auth/Login'
import { RegisterPage } from './pages/auth/Register'
import { ConfirmEmailPage } from './pages/auth/ConfirmEmail'
import { AuthCallbackPage } from './pages/auth/AuthCallback'
import Dashboard from './pages/Dashboard'
import Workspace from './pages/Workspace'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/confirm-email" element={<ConfirmEmailPage />} />

              {/* Auth callback */}
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
                path="/workspace"
                element={
                  <ProtectedRoute requireOnboarding>
                    <Workspace />
                  </ProtectedRoute>
                }
              />
              
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
