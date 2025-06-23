// Debug utilities for authentication and app flow

// Only show debug logs in development
const isDevelopment = process.env.NODE_ENV === 'development'

export const debugAuth = {
  log: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[AUTH DEBUG] ${message}`, data)
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[AUTH ERROR] ${message}`, error)
    }
  },
  
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[AUTH WARNING] ${message}`, data)
    }
  },
  
  logUserSession: (user: any, profile: any) => {
    if (isDevelopment) {
      console.log('[AUTH DEBUG] Current user session:', {
        user: user ? {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at,
          lastSignIn: user.last_sign_in_at
        } : null,
        profile: profile ? {
          id: profile.id,
          email: profile.email,
          onboardingCompleted: profile.onboarding_completed,
          planType: profile.plan_type
        } : null
      })
    }
  },
  
  logNavigationAttempt: (from: string, to: string, reason: string) => {
    if (isDevelopment) {
      console.log(`[AUTH DEBUG] Navigation attempt: ${from} -> ${to} (${reason})`)
    }
  }
}

export const createAuthTest = () => {
  return {
    async testConnection() {
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data, error } = await supabase.auth.getSession()
        
        if (isDevelopment) {
          console.log('[AUTH TEST] Connection test:', {
            hasSession: !!data.session,
            hasUser: !!data.session?.user,
            error: error?.message
          })
        }
        
        return !error
      } catch (error) {
        if (isDevelopment) {
          console.error('[AUTH TEST] Connection failed:', error)
        }
        return false
      }
    },
    
    async testProfileCreation(userId: string) {
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          
        if (isDevelopment) {
          console.log('[AUTH TEST] Profile test:', {
            hasProfile: !!data,
            profileData: data,
            error: error?.message
          })
        }
        
        return !!data
      } catch (error) {
        if (isDevelopment) {
          console.error('[AUTH TEST] Profile test failed:', error)
        }
        return false
      }
    }
  }
}