import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { LoaderCircle } from 'lucide-react'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        )

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login')
        } else {
          // Check if user needs onboarding
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', user.id)
              .single()

            if (profile?.onboarding_completed) {
              navigate('/dashboard')
            } else {
              navigate('/onboarding')
            }
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/login')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">Processando autenticação...</p>
      </div>
    </div>
  )
}