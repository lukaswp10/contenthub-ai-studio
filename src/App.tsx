import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import './styles/globals.css'

// Placeholder pages for future features
const UploadPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-2xl">Upload Page - Em breve</h1>
  </div>
)

const ClipsPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-2xl">Clips Page - Em breve</h1>
  </div>
)

const AnalyticsPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-2xl">Analytics Page - Em breve</h1>
  </div>
)

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/clips"
            element={
              <ProtectedRoute>
                <ClipsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App 