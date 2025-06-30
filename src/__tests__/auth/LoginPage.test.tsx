import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'

// Mock the auth context
const mockSignIn = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    user: null,
    loading: false
  })
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null })
  }
})

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with all elements', () => {
    renderWithRouter(<LoginPage />)

    // Check for form elements
    expect(screen.getByText('ClipsForge Pro')).toBeInTheDocument()
    expect(screen.getByText('Entrar na sua conta')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument()
    expect(screen.getByText('criar uma conta gratuita')).toBeInTheDocument()
  })

  it('should handle successful login', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit form
    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText('Entrando...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('should display error for invalid credentials', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid login credentials'))
    
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email ou senha incorretos')).toBeInTheDocument()
    })
  })

  it('should display error for unconfirmed email', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Email not confirmed'))
    
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Por favor, confirme seu email antes de fazer login')).toBeInTheDocument()
    })
  })

  it('should disable submit button when fields are empty', () => {
    renderWithRouter(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    expect(submitButton).toBeDisabled()

    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    // Still disabled with only email
    expect(submitButton).toBeDisabled()

    const passwordInput = screen.getByLabelText('Senha')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Now enabled
    expect(submitButton).not.toBeDisabled()
  })

  it('should disable form inputs while loading', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  it('should navigate to register page when clicking create account link', () => {
    renderWithRouter(<LoginPage />)

    const registerLink = screen.getByText('criar uma conta gratuita')
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('should navigate to forgot password page when clicking forgot password link', () => {
    renderWithRouter(<LoginPage />)

    const forgotPasswordLink = screen.getByText('Esqueceu sua senha?')
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
  })

  it('should show social login buttons as disabled', () => {
    renderWithRouter(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /Google/i })
    const githubButton = screen.getByRole('button', { name: /GitHub/i })

    expect(googleButton).toBeDisabled()
    expect(githubButton).toBeDisabled()
    expect(googleButton).toHaveAttribute('title', 'Em breve')
    expect(githubButton).toHaveAttribute('title', 'Em breve')
  })

  it('should call navigate after successful login', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    
    renderWithRouter(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Senha')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })
}) 