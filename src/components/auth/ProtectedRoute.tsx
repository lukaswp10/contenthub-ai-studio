import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const { user, session, profile, loading } = useAuth()
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Give some time for auth to initialize
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Show loading while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // If no user or session, redirect to login
  if (!user || !session) {
    console.log('🔒 Usuário não autenticado, redirecionando para login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If profile is still loading, show loading state
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  // Check onboarding requirement
  if (requireOnboarding && !profile.onboarding_completed) {
    console.log('🚀 Onboarding não concluído, redirecionando')
    return <Navigate to="/onboarding" replace />
  }

  // If trying to access onboarding but already completed, redirect to dashboard
  if (location.pathname === '/onboarding' && profile.onboarding_completed) {
    console.log('✅ Onboarding já concluído, redirecionando para dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('✅ Usuário autenticado:', user.email)
  return <>{children}</>
}