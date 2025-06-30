import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Mock do useAuth hook
const mockSignUp = vi.fn()
const mockUseAuth = {
  user: null,
  signUp: mockSignUp,
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  loading: false,
  session: null,
  updatePassword: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}))

// Mock do react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null })
  }
})

// Helper para renderizar com router
const renderWithRouter = (component: React.ReactElement, route = '/register') => {
  window.history.pushState({}, 'Test page', route)
  
  return render(
    <Router>
      {component}
    </Router>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render register page with header', () => {
      renderWithRouter(<RegisterPage />)
      
      // Header deve estar presente
      expect(screen.getByTitle('Voltar para página inicial')).toBeInTheDocument()
      expect(screen.getByText('ClipsForge Pro')).toBeInTheDocument()
      
      // Conteúdo da página deve estar presente
      expect(screen.getByText('Criar uma conta gratuita')).toBeInTheDocument()
      expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    })

    it('should have form submit button', () => {
      renderWithRouter(<RegisterPage />)
      
      const submitButton = document.querySelector('form button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('Criar conta gratuita')
    })

    it('should have terms text', () => {
      renderWithRouter(<RegisterPage />)
      
      expect(screen.getByText(/Ao criar uma conta, você concorda/)).toBeInTheDocument()
      expect(screen.getByText('Termos de Uso')).toBeInTheDocument()
      expect(screen.getByText('Política de Privacidade')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should require all fields', () => {
      renderWithRouter(<RegisterPage />)
      
      const nameInput = screen.getByLabelText('Nome completo')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar senha')
      
      expect(nameInput).toBeRequired()
      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
      expect(confirmPasswordInput).toBeRequired()
    })

    it('should have correct input types', () => {
      renderWithRouter(<RegisterPage />)
      
      const nameInput = screen.getByLabelText('Nome completo')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar senha')
      
      expect(nameInput).toHaveAttribute('type', 'text')
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should show password requirements text', () => {
      renderWithRouter(<RegisterPage />)
      
      expect(screen.getByText(/Mínimo 8 caracteres, com letras maiúsculas, minúsculas e números/)).toBeInTheDocument()
    })

    it('should disable submit button initially', () => {
      renderWithRouter(<RegisterPage />)
      
      const submitButton = document.querySelector('form button[type="submit"]')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call signUp when form is submitted with valid data', async () => {
      renderWithRouter(<RegisterPage />)
      
      const nameInput = screen.getByLabelText('Nome completo')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar senha')
      const form = nameInput.closest('form')
      
      fireEvent.change(nameInput, { target: { value: 'João Silva' } })
      fireEvent.change(emailInput, { target: { value: 'joao@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'MinhaSenh@123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'MinhaSenh@123' } })
      
      if (form) {
        fireEvent.submit(form)
        
        await waitFor(() => {
          expect(mockSignUp).toHaveBeenCalledWith('joao@example.com', 'MinhaSenh@123', 'João Silva')
        })
      }
    })

    it('should show loading state during submission', async () => {
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      renderWithRouter(<RegisterPage />)
      
      const nameInput = screen.getByLabelText('Nome completo')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar senha')
      const form = nameInput.closest('form')
      
      fireEvent.change(nameInput, { target: { value: 'João Silva' } })
      fireEvent.change(emailInput, { target: { value: 'joao@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'MinhaSenh@123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'MinhaSenh@123' } })
      
      if (form) {
        fireEvent.submit(form)
        
        await waitFor(() => {
          expect(screen.getByText('Criando conta...')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should display error for email already exists', async () => {
      mockSignUp.mockRejectedValue(new Error('User already registered'))
      
      renderWithRouter(<RegisterPage />)
      
      const nameInput = screen.getByLabelText('Nome completo')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar senha')
      const form = nameInput.closest('form')
      
      fireEvent.change(nameInput, { target: { value: 'João Silva' } })
      fireEvent.change(emailInput, { target: { value: 'joao@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'MinhaSenh@123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'MinhaSenh@123' } })
      
      if (form) {
        fireEvent.submit(form)
        
        await waitFor(() => {
          expect(screen.getByText('Este email já está cadastrado')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Navigation', () => {
    it('should have link to login page', () => {
      renderWithRouter(<RegisterPage />)
      
      const loginLink = screen.getByText('Fazer login')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
    })

    it('should have links to terms and privacy policy', () => {
      renderWithRouter(<RegisterPage />)
      
      const termsLink = screen.getByText('Termos de Uso')
      const privacyLink = screen.getByText('Política de Privacidade')
      
      expect(termsLink).toBeInTheDocument()
      expect(privacyLink).toBeInTheDocument()
      expect(termsLink.closest('a')).toHaveAttribute('href', '#')
      expect(privacyLink.closest('a')).toHaveAttribute('href', '#')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithRouter(<RegisterPage />)
      
      expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    })

    it('should have proper input attributes', () => {
      renderWithRouter(<RegisterPage />)
      
      const nameInput = screen.getByLabelText('Nome completo')
      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Senha')
      
      expect(nameInput).toHaveAttribute('autocomplete', 'name')
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive layout classes', () => {
      renderWithRouter(<RegisterPage />)
      
      const container = document.querySelector('.max-w-md')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('w-full')
    })
  })
}) 