import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter as Router } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'

// Mock do useAuth hook
const mockUser = {
  id: '123',
  email: 'test@example.com',
  user_metadata: { full_name: 'João Silva' }
}

const mockUseAuth = {
  user: mockUser,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  loading: false,
  session: { user: mockUser },
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
    useLocation: () => ({ pathname: '/dashboard' })
  }
})

// Helper para renderizar com router
const renderWithRouter = (component: React.ReactElement, route = '/dashboard') => {
  window.history.pushState({}, 'Test page', route)
  
  return render(
    <Router>
      {component}
    </Router>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Page Structure', () => {
    it('should render dashboard with header', () => {
      renderWithRouter(<DashboardPage />)
      
      // Header deve estar presente
      expect(screen.getByText('ClipsForge Pro')).toBeInTheDocument()
      
      // Título de boas-vindas
      expect(screen.getByText('Bem-vindo ao ClipsForge Pro! 🎉')).toBeInTheDocument()
      expect(screen.getByText(/Este é seu dashboard/)).toBeInTheDocument()
    })

    it('should display user email in header', () => {
      renderWithRouter(<DashboardPage />)
      
      const userEmails = screen.getAllByText('test@example.com')
      expect(userEmails.length).toBeGreaterThan(0)
      expect(userEmails[0]).toBeInTheDocument()
    })

    it('should have logout button', () => {
      renderWithRouter(<DashboardPage />)
      
      const logoutButton = screen.getByText('Sair')
      expect(logoutButton).toBeInTheDocument()
    })
  })

  describe('Statistics Cards', () => {
    it('should display available credits card', () => {
      renderWithRouter(<DashboardPage />)
      
      expect(screen.getByText('Créditos Disponíveis')).toBeInTheDocument()
      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('de 30 clips mensais')).toBeInTheDocument()
    })

    it('should display processed videos card', () => {
      renderWithRouter(<DashboardPage />)
      
      expect(screen.getByText('Vídeos Processados')).toBeInTheDocument()
      const zeroValues = screen.getAllByText('0')
      expect(zeroValues.length).toBeGreaterThan(0)
      expect(screen.getByText('este mês')).toBeInTheDocument()
    })

    it('should display clips created card', () => {
      renderWithRouter(<DashboardPage />)
      
      expect(screen.getByText('Clips Criados')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should call signOut when logout is clicked', () => {
      renderWithRouter(<DashboardPage />)
      
      const logoutButton = screen.getByText('Sair')
      fireEvent.click(logoutButton)
      
      expect(mockUseAuth.signOut).toHaveBeenCalled()
    })

    it('should have home link in header', () => {
      renderWithRouter(<DashboardPage />)
      
      const homeLink = screen.getByTitle('Voltar para página inicial')
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      renderWithRouter(<DashboardPage />)
      
      const mainContainer = document.querySelector('.max-w-7xl')
      expect(mainContainer).toBeInTheDocument()
    })

    it('should display grid layout for cards', () => {
      renderWithRouter(<DashboardPage />)
      
      const gridContainer = document.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper headings hierarchy', () => {
      renderWithRouter(<DashboardPage />)
      
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('ClipsForge Pro')
      
      const welcomeHeading = screen.getByRole('heading', { level: 2 })
      expect(welcomeHeading).toHaveTextContent('Bem-vindo ao ClipsForge Pro! 🎉')
    })

    it('should have keyboard navigation support', () => {
      renderWithRouter(<DashboardPage />)
      
      const interactiveElements = screen.getAllByRole('button')
      expect(interactiveElements.length).toBeGreaterThan(0)
      
      interactiveElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Content', () => {
    it('should display welcome message', () => {
      renderWithRouter(<DashboardPage />)
      
      expect(screen.getByText('Este é seu dashboard. Em breve você poderá criar clips virais aqui.')).toBeInTheDocument()
    })

    it('should show current statistics', () => {
      renderWithRouter(<DashboardPage />)
      
      // Deve mostrar estatísticas atuais
      const statsNumbers = screen.getAllByText('0')
      expect(statsNumbers.length).toBeGreaterThan(0)
    })
  })

  describe('User Interface', () => {
    it('should have proper styling classes', () => {
      renderWithRouter(<DashboardPage />)
      
      const dashboardContainer = document.querySelector('.min-h-screen')
      expect(dashboardContainer).toBeInTheDocument()
      expect(dashboardContainer).toHaveClass('bg-gray-50')
    })

    it('should display cards with proper styling', () => {
      renderWithRouter(<DashboardPage />)
      
      const cards = document.querySelectorAll('.rounded-xl')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
}) 