import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoaderCircle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
  requirePlan?: 'pro' | 'agency'
}

export function ProtectedRoute({ 
  children, 
  requireOnboarding = false,
  requirePlan 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Require onboarding completion
  if (requireOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }

  // Require specific plan
  if (requirePlan && profile) {
    const planHierarchy = { free: 0, pro: 1, agency: 2 }
    const userPlanLevel = planHierarchy[profile.plan_type]
    const requiredPlanLevel = planHierarchy[requirePlan]

    if (userPlanLevel < requiredPlanLevel) {
      return <Navigate to="/pricing" state={{ requirePlan }} replace />
    }
  }

  return <>{children}</>
}