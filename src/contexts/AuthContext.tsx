import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { debugAuth } from '@/utils/debug'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan_type: 'free' | 'pro' | 'agency'
  company_name: string | null
  onboarding_completed: boolean
  usage_videos_current_month: number
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      debugAuth.log('Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        debugAuth.error('Profile fetch error:', error)
        throw error
      }
      
      debugAuth.log('Profile fetched successfully:', data)
      setProfile(data as Profile)
      return data
    } catch (error) {
      debugAuth.error('Error fetching profile:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (mounted && initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          await fetchProfile(initialSession.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return

        console.log('Auth event:', event, currentSession?.user?.email)
        
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          // Use setTimeout to prevent infinite loops
          setTimeout(async () => {
            await fetchProfile(currentSession.user.id)
          }, 0)
        } else {
          setProfile(null)
        }

        // Handle auth events - ONLY show toasts, no navigation here
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in successfully')
            break
          case 'SIGNED_OUT':
            toast.success('Logout realizado com sucesso!')
            navigate('/')
            break
          case 'PASSWORD_RECOVERY':
            toast.success('Verifique seu email para redefinir a senha')
            break
          case 'USER_UPDATED':
            toast.success('Perfil atualizado com sucesso!')
            break
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }

      console.log('Sign in successful, user:', data.user?.email)

      // Update last login - use setTimeout to prevent blocking
      if (data.user) {
        setTimeout(async () => {
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.user.id)
        }, 100)
      }

      return
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      // Handle specific errors
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos')
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Por favor, confirme seu email antes de fazer login')
      } else {
        throw new Error(error.message || 'Erro ao fazer login')
      }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user?.identities?.length === 0) {
        throw new Error('Este email já está cadastrado')
      }

      toast.success('Conta criada! Verifique seu email para confirmar.')
      return
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      if (error.message.includes('already registered')) {
        throw new Error('Este email já está cadastrado')
      } else {
        throw new Error(error.message || 'Erro ao criar conta')
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error('Erro ao fazer logout')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.')
    } catch (error: any) {
      console.error('Reset password error:', error)
      throw new Error(error.message || 'Erro ao enviar email de recuperação')
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      
      toast.success('Senha atualizada com sucesso!')
    } catch (error: any) {
      console.error('Update password error:', error)
      throw new Error(error.message || 'Erro ao atualizar senha')
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data as Profile)
      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error(error.message || 'Erro ao atualizar perfil')
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      
      setSession(data.session)
      setUser(data.session?.user ?? null)
    } catch (error) {
      console.error('Refresh session error:', error)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}