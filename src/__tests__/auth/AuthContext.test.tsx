import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn()
    }))
  }
}))

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password', 'Test User')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide auth context to children', async () => {
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      access_token: 'token'
    }
    
    ;(supabase.auth.getSession as Mock).mockResolvedValue({
      data: { session: mockSession }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')

    // Wait for auth to initialize
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    // User should be loaded
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('should handle sign in', async () => {
    ;(supabase.auth.getSession as Mock).mockResolvedValue({
      data: { session: null }
    })
    
    ;(supabase.auth.signInWithPassword as Mock).mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    const signInButton = screen.getByText('Sign In')
    
    await act(async () => {
      signInButton.click()
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })

  it('should handle sign up with user profile creation', async () => {
    ;(supabase.auth.getSession as Mock).mockResolvedValue({
      data: { session: null }
    })
    
    const mockUser = { 
      id: '123', 
      email: 'test@example.com' 
    }
    
    ;(supabase.auth.signUp as Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as Mock).mockReturnValue({
      insert: mockInsert
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    const signUpButton = screen.getByText('Sign Up')
    
    await act(async () => {
      signUpButton.click()
    })

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })

    expect(supabase.from).toHaveBeenCalledWith('users')
    expect(mockInsert).toHaveBeenCalledWith([{
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      plan: 'free',
      credits_used: 0,
      credits_limit: 30
    }])
  })

  it('should handle sign out', async () => {
    ;(supabase.auth.getSession as Mock).mockResolvedValue({
      data: { session: { user: { email: 'test@example.com' } } }
    })
    
    ;(supabase.auth.signOut as Mock).mockResolvedValue({
      error: null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    const signOutButton = screen.getByText('Sign Out')
    
    await act(async () => {
      signOutButton.click()
    })

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
}) 