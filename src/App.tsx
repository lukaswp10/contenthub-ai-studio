import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ClipsProvider } from '@/contexts/ClipsContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { UploadPage } from '@/pages/upload/UploadPage'
import VideoEditorPage from '@/pages/editor/VideoEditorPageNew'
import { VideoEditorDemo } from '@/pages/editor/VideoEditorDemo'
import { ClipsPage } from '@/pages/clips/ClipsPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import TesteJogoPage from '@/pages/teste-jogo/TesteJogoPage'
import TesteJogoPageV2 from '@/pages/teste-jogo/TesteJogoPageV2'
import './styles/globals.css'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ClipsProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Blaze Double ML System - Public Routes */}
            <Route path="/teste-jogo" element={<TesteJogoPage />} />
            <Route path="/teste-jogo-v2" element={<TesteJogoPageV2 />} />
            
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