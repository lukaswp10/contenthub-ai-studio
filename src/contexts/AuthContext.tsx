import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
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
  }, [])

  // Force refresh session
  const forceRefreshSession = useCallback(async () => {
    try {
      console.log('🔄 Forçando refresh da sessão...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Erro ao renovar sessão:', error)
        // Se o refresh falhar, fazer logout
        await signOut()
        return false
      }
      
      if (data.session) {
        console.log('✅ Sessão renovada com sucesso')
        setSession(data.session)
        setUser(data.session.user)
        return true
      }
      
      return false
    } catch (err) {
      console.error('❌ Erro inesperado ao renovar sessão:', err)
      await signOut()
      return false
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação...')
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error)
          setLoading(false)
          return
        }
        
        if (mounted && initialSession) {
          console.log('✅ Sessão inicial encontrada:', initialSession.user?.email)
          setSession(initialSession)
          setUser(initialSession.user)
          await fetchProfile(initialSession.user.id)
        } else {
          console.log('ℹ️ Nenhuma sessão inicial encontrada')
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('✅ Inicialização da autenticação concluída')
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return

        console.log('🔔 Auth event:', event, currentSession?.user?.email)
        
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

        // Handle auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ Usuário logado com sucesso')
            break
          case 'SIGNED_OUT':
            console.log('👋 Usuário deslogado')
            toast.success('Logout realizado com sucesso!')
            navigate('/')
            break
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token renovado automaticamente')
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
  }, [navigate, fetchProfile])

  // Refresh session periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (session && user) {
        console.log('⏰ Verificando necessidade de refresh da sessão...')
        
        // Check if token is close to expiring (within 10 minutes)
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt ? expiresAt - now : 0
        
        if (timeUntilExpiry < 600) { // Less than 10 minutes
          console.log('⚠️ Token próximo do vencimento, renovando...')
          await forceRefreshSession()
        }
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
    
    return () => clearInterval(interval)
  }, [session, user, forceRefreshSession])

  const signOut = useCallback(async () => {
    try {
      console.log('👋 Fazendo logout...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear state
      setUser(null)
      setSession(null)
      setProfile(null)
      
      console.log('✅ Logout realizado com sucesso')
    } catch (error: any) {
      console.error('❌ Erro ao fazer logout:', error)
      // Force clear state even if logout fails
      setUser(null)
      setSession(null)
      setProfile(null)
      throw new Error(error.message || 'Erro ao fazer logout')
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando fazer login com:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Erro no login:', error)
        throw error
      }

      console.log('✅ Login realizado com sucesso:', data.user?.email)

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
      console.error('❌ Erro no login:', error)
      
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
      console.log('📝 Criando conta para:', email)
      
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

      console.log('✅ Conta criada com sucesso')
      toast.success('Conta criada! Verifique seu email para confirmar.')
      return
    } catch (error: any) {
      console.error('❌ Erro ao criar conta:', error)
      
      if (error.message.includes('User already registered')) {
        throw new Error('Este email já está cadastrado')
      } else {
        throw new Error(error.message || 'Erro ao criar conta')
      }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('🔑 Solicitando reset de senha para:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) throw error

      console.log('✅ Email de reset enviado')
      toast.success('Email de recuperação enviado!')
      return
    } catch (error: any) {
      console.error('❌ Erro ao solicitar reset:', error)
      throw new Error(error.message || 'Erro ao enviar email de recuperação')
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      console.log('🔐 Atualizando senha...')
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      console.log('✅ Senha atualizada')
      toast.success('Senha atualizada com sucesso!')
      return
    } catch (error: any) {
      console.error('❌ Erro ao atualizar senha:', error)
      throw new Error(error.message || 'Erro ao atualizar senha')
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      console.log('👤 Atualizando perfil...')
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile
      await fetchProfile(user.id)
      
      console.log('✅ Perfil atualizado')
      return
    } catch (error: any) {
      console.error('❌ Erro ao atualizar perfil:', error)
      throw new Error(error.message || 'Erro ao atualizar perfil')
    }
  }

  const refreshSession = async (): Promise<void> => {
    await forceRefreshSession()
  }

  const refreshProfile = async () => {
    if (!user) throw new Error('Usuário não autenticado')
    return await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
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
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}