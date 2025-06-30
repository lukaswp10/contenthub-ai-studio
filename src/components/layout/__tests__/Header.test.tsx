// import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Header } from '../Header'

// Wrapper para componentes que precisam de Router
const HeaderWithRouter = ({ ...props }) => (
  <BrowserRouter>
    <Header {...props} />
  </BrowserRouter>
)

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Logo and Navigation', () => {
    it('should render logo with link to home', () => {
      render(<HeaderWithRouter />)
      
      const homeLink = screen.getByTitle('Voltar para página inicial')
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
      
      const logo = screen.getByText('ClipsForge Pro')
      expect(logo).toBeInTheDocument()
      
      const logoIcon = screen.getByText('CF')
      expect(logoIcon).toBeInTheDocument()
    })

    it('should have correct logo styling', () => {
      render(<HeaderWithRouter />)
      
      const logoIcon = screen.getByText('CF')
      expect(logoIcon).toHaveClass('text-white', 'font-bold')
    })
  })

  describe('Auth Buttons Mode', () => {
    it('should show auth buttons when showAuthButtons is true', () => {
      render(<HeaderWithRouter showAuthButtons={true} />)
      
      expect(screen.getByText('Entrar')).toBeInTheDocument()
      expect(screen.getByText('Começar Grátis')).toBeInTheDocument()
      
      // Should not show default buttons
      expect(screen.queryByText('Registrar')).not.toBeInTheDocument()
    })

    it('should have correct links for auth buttons', () => {
      render(<HeaderWithRouter showAuthButtons={true} />)
      
      const loginButton = screen.getByText('Entrar').closest('a')
      const registerButton = screen.getByText('Começar Grátis').closest('a')
      
      expect(loginButton).toHaveAttribute('href', '/login')
      expect(registerButton).toHaveAttribute('href', '/register')
    })
  })

  describe('User Logged In Mode', () => {
    it('should show user info when user is logged in', () => {
      const mockLogout = vi.fn()
      
      render(
        <HeaderWithRouter 
          userEmail="test@example.com" 
          onLogout={mockLogout} 
        />
      )
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Sair')).toBeInTheDocument()
    })

    it('should call logout function when Sair is clicked', () => {
      const mockLogout = vi.fn()
      
      render(
        <HeaderWithRouter 
          userEmail="test@example.com" 
          onLogout={mockLogout} 
        />
      )
      
      const logoutButton = screen.getByText('Sair')
      fireEvent.click(logoutButton)
      
      expect(mockLogout).toHaveBeenCalledOnce()
    })

    it('should handle long email addresses', () => {
      const longEmail = 'muito.longo.email.address@dominio.muito.longo.com.br'
      const mockLogout = vi.fn()
      
      render(
        <HeaderWithRouter 
          userEmail={longEmail} 
          onLogout={mockLogout} 
        />
      )
      
      expect(screen.getByText(longEmail)).toBeInTheDocument()
    })
  })

  describe('Default Mode', () => {
    it('should show default auth buttons when no props provided', () => {
      render(<HeaderWithRouter />)
      
      expect(screen.getByText('Entrar')).toBeInTheDocument()
      
      // Should show different register button text on different screen sizes
      // In test environment, both might be present
      expect(
        screen.getByText('Começar Grátis') || screen.getByText('Registrar')
      ).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive classes', () => {
      render(<HeaderWithRouter />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky', 'top-0', 'z-50')
      
      const logo = screen.getByText('ClipsForge Pro')
      expect(logo).toHaveClass('text-xl', 'sm:text-2xl')
    })

    it('should have backdrop blur styling', () => {
      render(<HeaderWithRouter />)
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-white/95', 'backdrop-blur-sm', 'border-b')
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      render(<HeaderWithRouter />)
      
      const homeLink = screen.getByTitle('Voltar para página inicial')
      expect(homeLink).toHaveAttribute('title', 'Voltar para página inicial')
      
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      const mockLogout = vi.fn()
      
      render(
        <HeaderWithRouter 
          userEmail="test@example.com" 
          onLogout={mockLogout} 
        />
      )
      
      const logoutButton = screen.getByRole('button', { name: 'Sair' })
      expect(logoutButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined userEmail gracefully', () => {
      const mockLogout = vi.fn()
      
      render(
        <HeaderWithRouter 
          userEmail={undefined} 
          onLogout={mockLogout} 
        />
      )
      
      // Should fall back to default mode
      expect(screen.getByText('Entrar')).toBeInTheDocument()
    })

    it('should handle missing onLogout function', () => {
      render(
        <HeaderWithRouter 
          userEmail="test@example.com" 
          onLogout={undefined} 
        />
      )
      
      // Should fall back to default mode
      expect(screen.getByText('Entrar')).toBeInTheDocument()
    })
  })
}) 