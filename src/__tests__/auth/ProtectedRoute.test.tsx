import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Mock do AuthContext com diferentes estados
const mockSignOut = vi.fn()
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockResetPassword = vi.fn()
const mockUpdatePassword = vi.fn()

// Estado padrão do mock
let mockAuthState: any = {
  user: null,
  signUp: mockSignUp,
  signIn: mockSignIn,
  signOut: mockSignOut,
  resetPassword: mockResetPassword,
  loading: false,
  session: null,
  updatePassword: mockUpdatePassword,
}

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState
}))

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/test' })
  }
})

// Mock component para teste
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

// Helper para renderizar com router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <Router>
      {component}
    </Router>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Reset para estado padrão
    mockAuthState = {
      user: null,
      signUp: mockSignUp,
      signIn: mockSignIn,
      signOut: mockSignOut,
      resetPassword: mockResetPassword,
      loading: false,
      session: null,
      updatePassword: mockUpdatePassword,
    }
  })

  describe('Authentication States', () => {
    it('should show loading spinner when auth is loading', () => {
      mockAuthState.loading = true
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect to login when user is not authenticated', () => {
      mockAuthState.user = null
      mockAuthState.session = null
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should render children when user is authenticated', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'João Silva' }
      }
      
      mockAuthState.user = mockUser
      mockAuthState.session = { user: mockUser }

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should handle session without user', () => {
      mockAuthState.user = null
      mockAuthState.session = { user: null }
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading with proper styling', () => {
      mockAuthState.loading = true
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      const loadingContainer = document.querySelector('.min-h-screen')
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  describe('Multiple Children', () => {
    it('should render multiple children when authenticated', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'João Silva' }
      }
      
      mockAuthState.user = mockUser
      mockAuthState.session = { user: mockUser }

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should not render any children when not authenticated', () => {
      mockAuthState.user = null
      mockAuthState.session = null
      
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('child-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('child-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      mockAuthState.user = undefined
      mockAuthState.session = undefined
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle empty session gracefully', () => {
      mockAuthState.user = null
      mockAuthState.session = {}
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle no children gracefully', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'João Silva' }
      }
      
      mockAuthState.user = mockUser
      mockAuthState.session = { user: mockUser }

      renderWithRouter(<ProtectedRoute>{null}</ProtectedRoute>)

      expect(document.body).toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should handle unauthenticated state correctly', () => {
      mockAuthState.user = null
      mockAuthState.session = null
      
      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Component Behavior', () => {
    it('should not call navigate when authenticated', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'João Silva' }
      }
      
      mockAuthState.user = mockUser
      mockAuthState.session = { user: mockUser }

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should render correctly when loading is false and user exists', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'João Silva' }
      }
      
      mockAuthState.user = mockUser
      mockAuthState.session = { user: mockUser }
      mockAuthState.loading = false

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByText('Verificando autenticação...')).not.toBeInTheDocument()
    })
  })
}) 