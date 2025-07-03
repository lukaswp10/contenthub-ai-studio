import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ClipsProvider } from '@/contexts/ClipsContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { UploadPage } from '@/pages/upload/UploadPage'
import { VideoEditorPage } from '@/pages/editor/VideoEditorPage'
import { VideoEditorDemo } from '@/pages/editor/VideoEditorDemo'
import { ClipsPage } from '@/pages/clips/ClipsPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClipsProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
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
              path="/editor"
              element={
                <ProtectedRoute>
                  <VideoEditorPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/editor-demo"
              element={
                <ProtectedRoute>
                  <VideoEditorDemo />
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
          </Routes>
        </ClipsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App 