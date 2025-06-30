// import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Mock simples do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null })
    })
  }
}))

// Componente de teste
const TestComponent = () => {
  const auth = useAuth()
  
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No user'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="session">{auth.session ? 'Has session' : 'No session'}</div>
      <button 
        data-testid="sign-up" 
        onClick={() => auth.signUp('test@example.com', 'password123', 'Test User')}
      >
        Sign Up
      </button>
      <button 
        data-testid="sign-in" 
        onClick={() => auth.signIn('test@example.com', 'password123')}
      >
        Sign In
      </button>
      <button 
        data-testid="sign-out" 
        onClick={() => auth.signOut()}
      >
        Sign Out
      </button>
    </div>
  )
}

// const mockUser = {
//   id: 'user-123',
//   email: 'test@example.com',
//   aud: 'authenticated',
//   role: 'authenticated',
//   created_at: '2023-01-01T00:00:00Z',
//   updated_at: '2023-01-01T00:00:00Z',
//   app_metadata: {},
//   user_metadata: { full_name: 'Test User' },
// }

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with loading state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Inicialmente deve estar carregando
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('session')).toHaveTextContent('No session')
    })

    it('should finish loading after initialization', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })
  })

  describe('Authentication Functions', () => {
    it('should have all auth functions available', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      // Verificar se todos os botões/funções existem
      expect(screen.getByTestId('sign-up')).toBeInTheDocument()
      expect(screen.getByTestId('sign-in')).toBeInTheDocument()
      expect(screen.getByTestId('sign-out')).toBeInTheDocument()
    })

    it('should call signUp when button is clicked', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const signUpButton = screen.getByTestId('sign-up')
      
      await act(async () => {
        signUpButton.click()
      })

      expect(supabase.auth.signUp).toHaveBeenCalled()
    })

    it('should call signIn when button is clicked', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const signInButton = screen.getByTestId('sign-in')
      
      await act(async () => {
        signInButton.click()
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled()
    })

    it('should call signOut when button is clicked', async () => {
      const { supabase } = await import('@/lib/supabase')
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })

      const signOutButton = screen.getByTestId('sign-out')
      
      await act(async () => {
        signOutButton.click()
      })

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Hook Usage Error', () => {
    it('should throw error when useAuth is used outside provider', () => {
      const TestComponentOutsideProvider = () => {
        useAuth()
        return <div>Test</div>
      }

      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')
    })
  })

  describe('Provider Integration', () => {
    it('should provide context to nested components', async () => {
      const NestedComponent = () => {
        const { user, loading } = useAuth()
        return (
          <div>
            <span data-testid="nested-user">{user ? user.email : 'No nested user'}</span>
            <span data-testid="nested-loading">{loading ? 'Nested loading' : 'Nested not loading'}</span>
          </div>
        )
      }

      render(
        <AuthProvider>
          <div>
            <TestComponent />
            <NestedComponent />
          </div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('nested-loading')).toHaveTextContent('Nested not loading')
        expect(screen.getByTestId('nested-user')).toHaveTextContent('No nested user')
      })
    })
  })
}) 